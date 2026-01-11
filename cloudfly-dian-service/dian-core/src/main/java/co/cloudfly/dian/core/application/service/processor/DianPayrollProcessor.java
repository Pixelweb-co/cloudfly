package co.cloudfly.dian.core.application.service.processor;

import co.cloudfly.dian.common.enums.ElectronicDocumentStatus;
import co.cloudfly.dian.common.enums.ElectronicDocumentType;
import co.cloudfly.dian.common.event.ElectronicDocumentEvent;
import co.cloudfly.dian.common.payload.ElectronicPayrollPayload;
import co.cloudfly.dian.core.application.dto.DianApiResponse;
import co.cloudfly.dian.core.application.dto.DianOperationModeResponse;
import co.cloudfly.dian.core.domain.entity.ElectronicDocument;
import co.cloudfly.dian.core.domain.repository.ElectronicDocumentRepository;
import co.cloudfly.dian.core.infrastructure.client.DianApiClient;
import co.cloudfly.dian.core.infrastructure.client.ErpClient;
import co.cloudfly.dian.core.infrastructure.signer.XmlSigner;
import co.cloudfly.dian.core.infrastructure.xml.UblPayrollGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Procesador para nómina electrónica DIAN
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DianPayrollProcessor implements DocumentProcessor {

    private final ErpClient erpClient;
    private final DianApiClient dianApiClient;
    private final XmlSigner xmlSigner;
    private final UblPayrollGenerator ublGenerator;
    private final ElectronicDocumentRepository repository;

    @Override
    public boolean supports(ElectronicDocument document) {
        return document.getDocumentType() == ElectronicDocumentType.PAYROLL;
    }

    @Override
    @Transactional
    public void process(ElectronicDocument document, ElectronicDocumentEvent event) {
        log.info("🔄 Processing payroll: {}", document.getId());

        try {
            // 1. Actualizar estado
            document.setStatus(ElectronicDocumentStatus.PROCESSING);
            repository.save(document);

            // 2. Obtener payload
            ElectronicPayrollPayload payload = event.getPayroll();
            if (payload == null) {
                throw new IllegalStateException("Payroll payload is null");
            }

            // 3. Consultar configuración DIAN
            log.info("📡 Fetching DIAN configuration for payroll...");
            DianOperationModeResponse operationMode = erpClient.getActiveOperationMode(
                    document.getTenantId(),
                    document.getCompanyId(),
                    "PAYROLL");

            if (operationMode == null) {
                throw new IllegalStateException(
                        "No active operation mode found for payroll");
            }

            // Asignar número DIAN
            String dianNumber = payload.getPayrollReceiptId();
            if (dianNumber == null || dianNumber.isEmpty()) {
                dianNumber = payload.getPayrollSequence();
            }
            document.setDianDocumentNumber(dianNumber);

            // 4. Generar XML de nómina
            log.info("📄 Generating payroll XML...");
            String xmlContent = ublGenerator.generatePayrollXml(
                    payload,
                    operationMode);

            // 5. Firmar XML
            log.info("🔐 Signing payroll XML...");
            byte[] signedXml = xmlSigner.signXml(
                    xmlContent.getBytes(),
                    operationMode.getCertificatePath(),
                    operationMode.getCertificatePassword());

            document.setXmlSigned(signedXml);

            // 6. Enviar a DIAN
            log.info("📤 Sending payroll to DIAN ({})...", operationMode.getEnvironment());
            DianApiResponse dianResponse = dianApiClient.sendPayroll(
                    new String(signedXml),
                    operationMode);

            // 7. Actualizar con respuesta
            document.setXmlResponse(dianResponse.getXmlResponse().getBytes());
            document.setCufeOrCune(dianResponse.getCufe()); // CUNE en este caso

            if (dianResponse.isAccepted()) {
                document.setStatus(ElectronicDocumentStatus.ACCEPTED);
                log.info("✅ Payroll ACCEPTED by DIAN: CUNE={}", dianResponse.getCufe());
            } else {
                document.setStatus(ElectronicDocumentStatus.REJECTED);
                document.setErrorCode(dianResponse.getErrorCode());
                document.setErrorMessage(dianResponse.getErrorMessage());
                log.warn("❌ Payroll REJECTED: {}", dianResponse.getErrorMessage());
            }

            document.setProcessedAt(LocalDateTime.now());
            repository.save(document);

            log.info("✅ Payroll processing completed: {}", document.getId());

        } catch (Exception e) {
            log.error("❌ Error processing payroll", e);

            document.setStatus(ElectronicDocumentStatus.ERROR);
            document.setErrorCode("PROCESSING_ERROR");
            document.setErrorMessage(e.getMessage());
            document.setProcessedAt(LocalDateTime.now());
            repository.save(document);

            throw new RuntimeException("Failed to process payroll", e);
        }
    }
}
