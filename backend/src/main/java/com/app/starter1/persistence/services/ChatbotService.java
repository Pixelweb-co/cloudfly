package com.app.starter1.persistence.services;

import com.app.starter1.dto.ChatbotConfigDTO;
import com.app.starter1.persistence.entity.ChatbotConfig;
import com.app.starter1.persistence.entity.ChatbotType;
import com.app.starter1.persistence.repository.ChatbotConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatbotConfigRepository chatbotConfigRepository;
    private final EvolutionApiService evolutionApiService;

    @Transactional(readOnly = true)
    public ChatbotConfigDTO getConfigByTenant(Long tenantId) {
        return chatbotConfigRepository.findByTenantId(tenantId)
                .map(config -> {
                    ChatbotConfigDTO dto = mapToDTO(config);
                    // If active, we might want to check status, but for now just return config
                    // If not active, we could try to fetch QR if instance exists?
                    return dto;
                })
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public ChatbotConfigDTO getPublicConfig(String instanceName) {
        return chatbotConfigRepository.findByInstanceName(instanceName)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Chatbot config not found for instance: " + instanceName));
    }

    @Transactional
    public ChatbotConfigDTO createOrUpdateConfig(Long tenantId, ChatbotConfigDTO dto) {
        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId)
                .orElse(new ChatbotConfig());

        if (config.getId() == null) {
            config.setTenantId(tenantId);
            config.setApiKey(UUID.randomUUID().toString()); // Generate API Key on creation
        }

        config.setInstanceName(dto.getInstanceName());
        config.setChatbotType(dto.getChatbotType());
        config.setIsActive(dto.getIsActive());
        config.setN8nWebhookUrl(dto.getN8nWebhookUrl());
        config.setContext(dto.getContext());

        ChatbotConfig saved = chatbotConfigRepository.save(config);
        return mapToDTO(saved);
    }

    @Transactional
    public ChatbotConfigDTO activateChatbot(Long tenantId) {
        log.info("🔧 [CHATBOT-SERVICE] Starting activation for tenantId: {}", tenantId);

        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId)
                .orElse(new ChatbotConfig());

        if (config.getId() == null) {
            log.info("✨ [CHATBOT-SERVICE] Creating new config for tenantId: {}", tenantId);
            config.setTenantId(tenantId);
            config.setApiKey(UUID.randomUUID().toString());
            config.setInstanceName("cloudfly_" + tenantId);
            config.setChatbotType(ChatbotType.SALES);
            config.setIsActive(false);
            config.setN8nWebhookUrl("https://autobot.cloudfly.com.co/webhook/" + tenantId);
            log.info("📝 [CHATBOT-SERVICE] Config created - Instance: {}, Webhook: {}",
                    config.getInstanceName(), config.getN8nWebhookUrl());
        } else {
            log.info("📂 [CHATBOT-SERVICE] Using existing config - Instance: {}", config.getInstanceName());
        }

        // Create instance in Evolution API
        try {
            log.info("🌐 [CHATBOT-SERVICE] Calling Evolution API to create instance: {}", config.getInstanceName());
            java.util.Map<String, Object> response = evolutionApiService.createInstance(config.getInstanceName(),
                    config.getN8nWebhookUrl());
            log.info("✅ [CHATBOT-SERVICE] Evolution API response received");

            // If response contains QR, use it
            String qrCode = null;
            if (response != null && response.containsKey("qrcode")) {
                Object qrObj = response.get("qrcode");
                if (qrObj instanceof java.util.Map) {
                    qrCode = (String) ((java.util.Map) qrObj).get("base64");
                    log.info("🔲 [CHATBOT-SERVICE] QR code found in create response");
                }
            }

            // If no QR in create response, fetch it explicitly
            if (qrCode == null) {
                log.info("🔍 [CHATBOT-SERVICE] No QR in response, fetching explicitly");
                java.util.Map<String, Object> qrResponse = evolutionApiService.fetchQrCode(config.getInstanceName());
                if (qrResponse != null && qrResponse.containsKey("base64")) {
                    qrCode = (String) qrResponse.get("base64");
                    log.info("✅ [CHATBOT-SERVICE] QR code fetched successfully");
                }
            }

            ChatbotConfig saved = chatbotConfigRepository.save(config);
            log.info("💾 [CHATBOT-SERVICE] Config saved to database");

            ChatbotConfigDTO dto = mapToDTO(saved);
            dto.setQrCode(qrCode);
            log.info("✅ [CHATBOT-SERVICE] Activation completed for tenantId: {}", tenantId);
            return dto;

        } catch (Exception e) {
            log.error("⚠️ [CHATBOT-SERVICE] Error during activation: {}", e.getMessage());

            // If instance already exists, try to fetch QR
            if (e.getMessage().contains("already exists")) {
                log.info("ℹ️ [CHATBOT-SERVICE] Instance already exists, fetching QR");
                try {
                    java.util.Map<String, Object> qrResponse = evolutionApiService
                            .fetchQrCode(config.getInstanceName());
                    ChatbotConfig saved = chatbotConfigRepository.save(config);
                    ChatbotConfigDTO dto = mapToDTO(saved);
                    if (qrResponse != null && qrResponse.containsKey("base64")) {
                        dto.setQrCode((String) qrResponse.get("base64"));
                        log.info("✅ [CHATBOT-SERVICE] QR fetched for existing instance");
                    }
                    return dto;
                } catch (Exception ex) {
                    log.error("❌ [CHATBOT-SERVICE] Failed to fetch QR for existing instance: {}", ex.getMessage(), ex);
                    throw new RuntimeException("Failed to activate chatbot: " + ex.getMessage());
                }
            }
            log.error("❌ [CHATBOT-SERVICE] Activation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to activate chatbot: " + e.getMessage());
        }
    }

    public ChatbotConfigDTO getQrCode(Long tenantId) {
        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Chatbot config not found"));

        try {
            java.util.Map<String, Object> qrResponse = evolutionApiService.fetchQrCode(config.getInstanceName());
            ChatbotConfigDTO dto = mapToDTO(config);
            if (qrResponse != null && qrResponse.containsKey("base64")) {
                dto.setQrCode((String) qrResponse.get("base64"));
            }
            return dto;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch QR code: " + e.getMessage());
        }
    }

    private ChatbotConfigDTO mapToDTO(ChatbotConfig entity) {
        ChatbotConfigDTO dto = new ChatbotConfigDTO();
        dto.setId(entity.getId());
        dto.setTenantId(entity.getTenantId());
        dto.setInstanceName(entity.getInstanceName());
        dto.setChatbotType(entity.getChatbotType());
        dto.setIsActive(entity.getIsActive());
        dto.setN8nWebhookUrl(entity.getN8nWebhookUrl());
        dto.setContext(entity.getContext());
        dto.setApiKey(entity.getApiKey());
        return dto;
    }
}
