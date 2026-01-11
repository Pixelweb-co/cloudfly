package co.cloudfly.dian.core.application.service.processor;

import co.cloudfly.dian.common.enums.ElectronicDocumentStatus;
import co.cloudfly.dian.common.enums.ElectronicDocumentType;
import co.cloudfly.dian.common.event.ElectronicDocumentEvent;
import co.cloudfly.dian.common.payload.ElectronicInvoicePayload;
import co.cloudfly.dian.core.application.dto.DianApiResponse;
import co.cloudfly.dian.core.application.dto.DianOperationModeResponse;
import co.cloudfly.dian.core.application.dto.DianResolutionResponse;
import co.cloudfly.dian.core.domain.entity.ElectronicDocument;
import co.cloudfly.dian.core.domain.repository.ElectronicDocumentRepository;
import co.cloudfly.dian.core.infrastructure.client.DianApiClient;
import co.cloudfly.dian.core.infrastructure.client.ErpClient;
import co.cloudfly.dian.core.infrastructure.signer.XmlSigner;
import co.cloudfly.dian.core.infrastructure.xml.UblInvoiceGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Procesador para facturas electrónicas y notas (crédito/débito)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DianInvoiceProcessor implements DocumentProcessor {

    private final ErpClient erpClient;
    private final DianApiClient dianApiClient;
    private final XmlSigner xmlSigner;
    private final UblInvoiceGenerator ublGenerator;
    private final ElectronicDocumentRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(ElectronicDocument document) {
        ElectronicDocumentType type = document.getDocumentType();
        return type == ElectronicDocumentType.INVOICE
                || type == ElectronicDocumentType.CREDIT_NOTE
                || type == ElectronicDocumentType.DEBIT_NOTE;
    }

    @Override
    @Transactional
    public void process(ElectronicDocument document, ElectronicDocumentEvent event) {
        log.info("🔄 Processing invoice/note: {} - Type: {}",
                document.getId(), document.getDocumentType());

        try {
            // 1. Actualizar estado a PROCESSING
            document.setStatus(ElectronicDocumentStatus.PROCESSING);
            repository.save(document);

            // 2. Obtener payload
            ElectronicInvoicePayload payload = event.getInvoice();
            if (payload == null) {
                throw new IllegalStateException("Invoice payload is null");
            }

            // 3. Consultar configuración DIAN al ERP
            log.info("📡 Fetching DIAN configuration from ERP...");
            DianOperationModeResponse operationMode = erpClient.getActiveOperationMode(
                    document.getTenantId(),
                    document.getCompanyId(),
                    document.getDocumentType().name());

            if (operationMode == null) {
                throw new IllegalStateException(
                        "No active operation mode found for tenant/company/docType");
            }

            // 4. Obtener resolución activa y asignar consecutivo
            log.info("📋 Fetching active resolution...");
            DianResolutionResponse resolution = erpClient.getActiveResolution(
                    document.getTenantId(),
                    document.getCompanyId(),
                    document.getDocumentType().name(),
                    payload.getExternalInvoiceNumber() != null ? extractPrefix(payload.getExternalInvoiceNumber())
                            : "FE");

            if (resolution == null) {
                throw new IllegalStateException("No active resolution found");
            }

            // Asignar número DIAN si no viene en el payload
            String dianNumber = payload.getExternalInvoiceNumber();
            if (dianNumber == null || dianNumber.isEmpty()) {
                dianNumber = resolution.getPrefix() + resolution.getCurrentNumber();
                payload.setExternalInvoiceNumber(dianNumber);
            }

            document.setDianDocumentNumber(dianNumber);

            // 5. Generar XML UBL 2.1
            log.info("📄 Generating UBL XML...");
            String xmlContent = ublGenerator.generateInvoiceXml(
                    payload,
                    operationMode,
                    resolution);

            // 6. Firmar XML
            log.info("🔐 Signing XML...");
            byte[] signedXml = xmlSigner.signXml(
                    xmlContent.getBytes(),
                    operationMode.getCertificatePath(),
                    operationMode.getCertificatePassword());

            document.setXmlSigned(signedXml);

            // 7. Enviar a DIAN
            log.info("📤 Sending to DIAN ({})...", operationMode.getEnvironment());
            DianApiResponse dianResponse = dianApiClient.sendInvoice(
                    new String(signedXml),
                    operationMode);

            // 8. Actualizar documento con respuesta DIAN
            document.setXmlResponse(dianResponse.getXmlResponse().getBytes());
            document.setCufeOrCune(dianResponse.getCufe());

            if (dianResponse.isAccepted()) {
                document.setStatus(ElectronicDocumentStatus.ACCEPTED);
                log.info("✅ Document ACCEPTED by DIAN: CUFE={}", dianResponse.getCufe());
            } else {
                document.setStatus(ElectronicDocumentStatus.REJECTED);
                document.setErrorCode(dianResponse.getErrorCode());
                document.setErrorMessage(dianResponse.getErrorMessage());
                log.warn("❌ Document REJECTED by DIAN: {}", dianResponse.getErrorMessage());
            }

            document.setProcessedAt(LocalDateTime.now());
            repository.save(document);

            log.info("✅ Invoice processing completed: {}", document.getId());

        } catch (Exception e) {
            log.error("❌ Error processing invoice", e);

            // Actualizar a ERROR
            document.setStatus(ElectronicDocumentStatus.ERROR);
            document.setErrorCode("PROCESSING_ERROR");
            document.setErrorMessage(e.getMessage());
            document.setProcessedAt(LocalDateTime.now());
            repository.save(document);

            throw new RuntimeException("Failed to process invoice", e);
        }
    }

    /**
     * Extrae el prefijo de un número DIAN (ej: "FE001234" -> "FE")
     */
    private String extractPrefix(String dianNumber) {
        if (dianNumber == null || dianNumber.isEmpty()) {
            return "";
        }

        // Buscar donde terminan las letras y empiezan los números
        int i = 0;
        while (i < dianNumber.length() && !Character.isDigit(dianNumber.charAt(i))) {
            i++;
        }

        return i > 0 ? dianNumber.substring(0, i) : "";
    }
}
