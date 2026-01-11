package co.cloudfly.dian.core.infrastructure.kafka;

import co.cloudfly.dian.common.event.ElectronicDocumentEvent;
import co.cloudfly.dian.core.application.service.ElectronicDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ElectronicDocumentConsumer {

    private final ElectronicDocumentService documentService;

    @KafkaListener(topics = "${kafka.topic.electronic-documents}", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "kafkaListenerContainerFactory")
    public void consume(ElectronicDocumentEvent event) {
        log.info("📨 Received event: {} - Type: {} - Tenant: {} - Source: {}",
                event.getEventId(),
                event.getDocumentType(),
                event.getTenantId(),
                event.getSourceDocumentId());

        try {
            // Validar evento
            if (!event.isValid()) {
                log.error("❌ Invalid event received: {}", event.getEventId());
                return;
            }

            // Procesar documento
            documentService.processEvent(event);

            log.info("✅ Event processed successfully: {}", event.getEventId());

        } catch (Exception e) {
            log.error("❌ Error processing event: {}", event.getEventId(), e);
            // En producción: manejar con DLQ (Dead Letter Queue)
        }
    }
}
