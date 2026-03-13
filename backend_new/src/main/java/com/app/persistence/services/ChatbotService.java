package com.app.persistence.services;

import com.app.dto.ChatbotConfigDTO;
import com.app.persistence.entity.ChatbotConfig;
import com.app.persistence.repository.ChatbotConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatbotConfigRepository chatbotConfigRepository;
    private final EvolutionService evolutionService;

    public Mono<ChatbotConfigDTO> getConfigByTenant(Long tenantId) {
        log.info("📋 [CHATBOT-SERVICE] Getting config for tenantId: {}", tenantId);
        return chatbotConfigRepository.findByTenantId(tenantId)
                .map(this::mapToDTO);
    }

    public Mono<ChatbotConfigDTO> getStatus(Long tenantId) {
        log.info("📊 [CHATBOT-SERVICE] Getting status for tenantId: {}", tenantId);
        return chatbotConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.checkConnection(config.getInstanceName())
                        .flatMap(statusRes -> {
                            ChatbotConfigDTO dto = mapToDTO(config);
                            dto.setExists(true);
                            Object instObj = statusRes.get("instance");
                            if (instObj instanceof Map) {
                                Map<String, Object> instance = (Map<String, Object>) instObj;
                                String state = (String) instance.get("state");
                                if (state == null) state = (String) instance.get("status");
                                dto.setIsConnected("open".equals(state));
                            } else {
                                String connectionState = (String) statusRes.get("state");
                                if (connectionState == null) connectionState = (String) statusRes.get("status");
                                dto.setIsConnected("open".equals(connectionState));
                            }

                            if (!dto.getIsConnected()) {
                                return evolutionService.fetchQrCode(config.getInstanceName())
                                        .map(qrRes -> {
                                            if (qrRes != null && qrRes.containsKey("base64")) {
                                                dto.setQrCode((String) qrRes.get("base64"));
                                            }
                                            return dto;
                                        })
                                        .onErrorResume(e -> Mono.just(dto));
                            }
                            return Mono.just(dto);
                        })
                        .onErrorResume(e -> {
                            log.warn("⚠️ Instance not found in Evolution: {}", config.getInstanceName());
                            ChatbotConfigDTO dto = mapToDTO(config);
                            dto.setExists(false);
                            dto.setIsConnected(false);
                            return Mono.just(dto);
                        })
                )
                .switchIfEmpty(Mono.just(ChatbotConfigDTO.builder().exists(false).isConnected(false).build()));
    }

    public Mono<ChatbotConfigDTO> activateChatbot(Long tenantId) {
        log.info("🚀 [CHATBOT-SERVICE] Activating chatbot for tenant: {}", tenantId);
        return chatbotConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.createInstance(config.getInstanceName())
                        .onErrorResume(err -> {
                            if (err instanceof InstanceAlreadyExistsException || err.getMessage().contains("already exists")) {
                                log.info("ℹ️ [CHATBOT-SERVICE] Instance already exists, continuing with update/status");
                                return Mono.empty();
                            }
                            return Mono.error(err);
                        })
                        .then(Mono.defer(() -> {
                            log.info("✅ [CHATBOT-SERVICE] Ensuring config is active: {}", tenantId);
                            config.setIsActive(true);
                            config.setUpdatedAt(LocalDateTime.now());
                            return chatbotConfigRepository.save(config)
                                    .then(getQrOnlyIfDisconnected(tenantId));
                        }))
                );
    }

    private Mono<ChatbotConfigDTO> getQrOnlyIfDisconnected(Long tenantId) {
        return getStatus(tenantId);
    }

    public Mono<ChatbotConfigDTO> getQrCode(Long tenantId) {
        return chatbotConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.fetchQrCode(config.getInstanceName())
                        .map(qrRes -> {
                            ChatbotConfigDTO dto = mapToDTO(config);
                            if (qrRes != null && qrRes.containsKey("base64")) {
                                dto.setQrCode((String) qrRes.get("base64"));
                            }
                            return dto;
                        })
                );
    }

    private ChatbotConfigDTO mapToDTO(ChatbotConfig entity) {
        return ChatbotConfigDTO.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .instanceName(entity.getInstanceName())
                .chatbotType(entity.getChatbotType())
                .isActive(entity.getIsActive())
                .n8nWebhookUrl(entity.getN8nWebhookUrl())
                .context(entity.getContext())
                .agentName(entity.getAgentName())
                .apiKey(entity.getApiKey())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
