package com.app.workflow.engine;

import com.app.persistence.repository.ChannelRepository;
import com.app.persistence.services.EvolutionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Strategy implementation to send WhatsApp text messages.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SendWhatsappActionExecutor implements WorkflowActionExecutor {

    private final EvolutionService evolutionService;
    private final ChannelRepository channelRepository;
    private final ObjectMapper objectMapper;

    @Override
    public String getActionCode() {
        return "whatsapp.send_text";
    }

    @Override
    public Mono<Void> execute(Long tenantId, Long companyId, Map<String, Object> parameters, Map<String, Object> triggerPayload) {
        log.info("📡 [WHATSAPP-EXECUTOR] Triggered action for tenant: {}, company: {}", tenantId, companyId);

        if (parameters == null) {
            return Mono.error(new IllegalArgumentException("Parámetros de acción de WhatsApp no configurados."));
        }

        String rawPhone = (String) parameters.get("phone");
        String rawText = (String) parameters.get("text_message");

        if (rawPhone == null || rawPhone.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Número de teléfono (phone) no especificado."));
        }
        if (rawText == null || rawText.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Mensaje de texto (text_message) no especificado."));
        }

        // Convert trigger payload map to JsonNode for variable resolution
        JsonNode payloadNode = objectMapper.valueToTree(triggerPayload != null ? triggerPayload : Map.of());

        // Resolve template variables
        String resolvedPhone = WorkflowEngineUtils.resolveVariables(rawPhone, payloadNode);
        String resolvedText = WorkflowEngineUtils.resolveVariables(rawText, payloadNode);

        // Clean phone number: keep only numbers
        String cleanPhone = resolvedPhone.replaceAll("[^0-9]", "");
        if (cleanPhone.isEmpty()) {
            return Mono.error(new IllegalArgumentException("Número de teléfono resuelto vacío o inválido: " + resolvedPhone));
        }

        log.info("📤 [WHATSAPP-EXECUTOR] Resolved phone: '{}', sending text: '{}'", cleanPhone, resolvedText);

        // Find active WhatsApp channel for this tenant and company to get the instanceName
        return channelRepository.findByCompanyIdAndTenantId(companyId, tenantId)
                .filter(channel -> "WHATSAPP".equalsIgnoreCase(channel.getPlatform()) && Boolean.TRUE.equals(channel.getStatus()))
                .next()
                .switchIfEmpty(Mono.error(new IllegalStateException("No se encontró ningún canal de WhatsApp activo para esta compañía.")))
                .flatMap(channel -> {
                    String instanceName = channel.getInstanceName();
                    log.info("📡 [WHATSAPP-EXECUTOR] Found active instance '{}' for company ID {}", instanceName, companyId);
                    return evolutionService.sendSimpleMessage(instanceName, cleanPhone, resolvedText);
                })
                .doOnSuccess(res -> log.info("✅ [WHATSAPP-EXECUTOR] Message sent successfully to {}", cleanPhone))
                .doOnError(err -> log.error("❌ [WHATSAPP-EXECUTOR] Failed to send WhatsApp message: {}", err.getMessage()))
                .then();
    }
}
