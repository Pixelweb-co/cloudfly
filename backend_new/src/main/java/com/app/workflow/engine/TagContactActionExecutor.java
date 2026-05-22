package com.app.workflow.engine;

import com.app.persistence.entity.TagEntity;
import com.app.persistence.repository.TagRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Strategy implementation to tag a CRM contact.
 * Self-healing: creates the tag in the company's catalog if it doesn't exist.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TagContactActionExecutor implements WorkflowActionExecutor {

    private final TagRepository tagRepository;
    private final ObjectMapper objectMapper;

    @Override
    public String getActionCode() {
        return "crm.tag_contact";
    }

    @Override
    public Mono<Void> execute(Long tenantId, Long companyId, Map<String, Object> parameters, Map<String, Object> triggerPayload) {
        log.info("🏷️ [TAG-CONTACT-EXECUTOR] Triggered tag contact action for tenant: {}, company: {}", tenantId, companyId);

        if (parameters == null) {
            return Mono.error(new IllegalArgumentException("Parámetros de acción de etiquetado no configurados."));
        }

        JsonNode payloadNode = objectMapper.valueToTree(triggerPayload != null ? triggerPayload : Map.of());

        // 1. Resolve contact ID
        Long contactId = resolveContactId(parameters, payloadNode);
        if (contactId == null) {
            return Mono.error(new IllegalArgumentException("No se pudo resolver el ID del contacto (contact_id) desde los parámetros o el payload del disparador."));
        }

        // 2. Resolve tag name
        String rawTagName = (String) parameters.get("tag_name");
        if (rawTagName == null || rawTagName.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Nombre de la etiqueta (tag_name) no especificado."));
        }
        String resolvedTagName = WorkflowEngineUtils.resolveVariables(rawTagName, payloadNode).trim();
        if (resolvedTagName.isEmpty()) {
            return Mono.error(new IllegalArgumentException("Nombre de la etiqueta resuelto vacío."));
        }

        log.info("🏷️ [TAG-CONTACT-EXECUTOR] Tagging contact ID: {} with tag name: '{}'", contactId, resolvedTagName);

        // 3. Find tag by name or create it, then associate it reactively
        return tagRepository.findByTenantIdAndCompanyIdAndName(tenantId, companyId, resolvedTagName)
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("✨ [TAG-CONTACT-EXECUTOR] Tag '{}' not found in company ID {}. Creating automatically...", resolvedTagName, companyId);
                    TagEntity newTag = TagEntity.builder()
                            .tenantId(tenantId)
                            .companyId(companyId)
                            .name(resolvedTagName)
                            .color("#7367F0")
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return tagRepository.save(newTag);
                }))
                .flatMap(tag -> tagRepository.isTagAssociated(contactId, tag.getId())
                        .flatMap(associationCount -> {
                            if (associationCount == 0) {
                                log.info("🔗 [TAG-CONTACT-EXECUTOR] Associating tag '{}' (ID: {}) with contact ID: {}", resolvedTagName, tag.getId(), contactId);
                                return tagRepository.associateTag(contactId, tag.getId());
                            }
                            log.info("🏷️ [TAG-CONTACT-EXECUTOR] Tag '{}' is already associated with contact ID: {}", resolvedTagName, contactId);
                            return Mono.empty();
                        })
                )
                .doOnSuccess(res -> log.info("✅ [TAG-CONTACT-EXECUTOR] Successfully completed tagging process for contact ID: {}", contactId))
                .doOnError(err -> log.error("❌ [TAG-CONTACT-EXECUTOR] Error during tagging process: {}", err.getMessage()))
                .then();
    }

    /**
     * Resolves the contact ID by checking the action parameters first, then scanning common paths in the payload.
     */
    private Long resolveContactId(Map<String, Object> parameters, JsonNode payloadNode) {
        // Option 1: Direct contact_id in parameters (could be double braces variable)
        Object contactIdObj = parameters.get("contact_id");
        if (contactIdObj != null) {
            String resolvedStr = WorkflowEngineUtils.resolveVariables(contactIdObj.toString(), payloadNode).trim();
            if (!resolvedStr.isEmpty()) {
                try {
                    return Long.parseLong(resolvedStr);
                } catch (NumberFormatException e) {
                    log.warn("⚠️ [TAG-CONTACT-EXECUTOR] Failed to parse resolved contact_id '{}': {}", resolvedStr, e.getMessage());
                }
            }
        }

        // Option 2: Search typical payload conventions
        String[] commonPaths = {
                "data.contact.id",
                "data.customer.id",
                "data.appointment.contactId",
                "data.contactId",
                "data.customerId",
                "data.contact_id",
                "contactId",
                "contact_id",
                "customerId",
                "id"
        };
        for (String path : commonPaths) {
            JsonNode node = WorkflowEngineUtils.getValueByPath(payloadNode, path);
            if (node != null && !node.isMissingNode() && !node.isNull()) {
                try {
                    return node.asLong();
                } catch (Exception e) {
                    // Continue scanning
                }
            }
        }
        return null;
    }
}
