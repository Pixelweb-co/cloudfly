package co.cloudfly.dian.core.application.service;

import co.cloudfly.dian.common.enums.ElectronicDocumentStatus;
import co.cloudfly.dian.common.event.ElectronicDocumentEvent;
import co.cloudfly.dian.core.application.service.processor.DocumentProcessor;
import co.cloudfly.dian.core.domain.entity.ElectronicDocument;
import co.cloudfly.dian.core.domain.repository.ElectronicDocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElectronicDocumentService {

    private final ElectronicDocumentRepository repository;
    private final List<DocumentProcessor> documentProcessors;
    private final ObjectMapper objectMapper;

    /**
     * Procesa el evento recibido de Kafka
     */
    @Async
    @Transactional
    public void processEvent(ElectronicDocumentEvent event) {
        log.info("Processing event: {}", event.getEventId());

        try {
            // 1. Verificar si ya existe
            if (repository.existsByEventId(event.getEventId())) {
                log.warn("Event already processed: {}", event.getEventId());
                return;
            }

            // 2. Crear registro inicial
            ElectronicDocument document = createInitialDocument(event);
            document = repository.save(document);

            log.info("Document saved with RECEIVED status: ID={}", document.getId());

            // 3. Buscar el procesador adecuado (usar variable final para lambda)
            final ElectronicDocument finalDocument = document;
            DocumentProcessor processor = documentProcessors.stream()
                    .filter(p -> p.supports(finalDocument))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException(
                            "No processor found for document type: " + finalDocument.getDocumentType()));

            // 4. Procesar documento
            processor.process(document, event);

        } catch (Exception e) {
            log.error("Error processing event: {}", event.getEventId(), e);
            throw new RuntimeException("Failed to process event", e);
        }
    }

    /**
     * Crea el documento inicial con estado RECEIVED
     */
    private ElectronicDocument createInitialDocument(ElectronicDocumentEvent event) {
        try {
            String payloadJson = objectMapper.writeValueAsString(
                    event.getDocumentType().name().contains("PAYROLL") ? event.getPayroll() : event.getInvoice());

            return ElectronicDocument.builder()
                    .eventId(event.getEventId())
                    .documentType(event.getDocumentType())
                    .tenantId(event.getTenantId())
                    .companyId(event.getCompanyId())
                    .sourceSystem(event.getSourceSystem())
                    .sourceDocumentId(event.getSourceDocumentId())
                    .environment(event.getEnvironmentHint() != null ? event.getEnvironmentHint() : "TEST")
                    .status(ElectronicDocumentStatus.RECEIVED)
                    .payloadJson(payloadJson)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to create initial document", e);
        }
    }

    /**
     * Busca todos los documentos de un tenant/compañía
     */
    @Transactional(readOnly = true)
    public List<ElectronicDocument> findByTenantAndCompany(Long tenantId, Long companyId) {
        return repository.findByTenantIdAndCompanyId(tenantId, companyId);
    }

    /**
     * Busca un documento por ID
     */
    @Transactional(readOnly = true)
    public ElectronicDocument findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    /**
     * Busca un documento por su ID de origen
     */
    @Transactional(readOnly = true)
    public ElectronicDocument findBySource(Long tenantId, Long companyId, String sourceId) {
        return repository.findByTenantIdAndCompanyIdAndSourceDocumentId(
                tenantId, companyId, sourceId).orElse(null);
    }
}
