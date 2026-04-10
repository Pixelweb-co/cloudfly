package com.app.events;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public Mono<Void> publishProductChange(Object productPayload) {
        return Mono.fromRunnable(() -> {
            try {
                String payloadAsJson = objectMapper.writeValueAsString(productPayload);
                kafkaTemplate.send("product.updates", payloadAsJson);
                log.info("✅ Evento product.updates publicado: {}", payloadAsJson.substring(0, Math.min(60, payloadAsJson.length())));
            } catch (Exception e) {
                log.error("❌ Error serializando producto para Kafka: {}", e.getMessage());
            }
        });
    }
}
