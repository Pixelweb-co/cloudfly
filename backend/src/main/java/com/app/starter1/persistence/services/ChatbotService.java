package com.app.starter1.persistence.services;

import com.app.starter1.dto.ChatbotConfigDTO;
import com.app.starter1.persistence.entity.ChatbotConfig;
import com.app.starter1.persistence.entity.ChatbotType;
import com.app.starter1.persistence.repository.ChatbotConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId)
                .orElse(new ChatbotConfig());

        if (config.getId() == null) {
            config.setTenantId(tenantId);
            config.setApiKey(UUID.randomUUID().toString());
            config.setInstanceName("cloudfly_" + tenantId); // Generate instance name
            config.setChatbotType(ChatbotType.SALES); // Default type
            config.setIsActive(false);
            config.setN8nWebhookUrl("https://autobot.cloudfly.com.co/webhook/" + tenantId); // Default webhook
        }

        // Create instance in Evolution API
        try {
            // We pass the webhook URL to Evolution API so it can send events there
            java.util.Map<String, Object> response = evolutionApiService.createInstance(config.getInstanceName(),
                    config.getN8nWebhookUrl());

            // If response contains QR, use it
            String qrCode = null;
            if (response != null && response.containsKey("qrcode")) {
                Object qrObj = response.get("qrcode");
                if (qrObj instanceof java.util.Map) {
                    qrCode = (String) ((java.util.Map) qrObj).get("base64");
                }
            }

            // If no QR in create response (sometimes it is), fetch it explicitly
            if (qrCode == null) {
                java.util.Map<String, Object> qrResponse = evolutionApiService.fetchQrCode(config.getInstanceName());
                if (qrResponse != null && qrResponse.containsKey("base64")) {
                    qrCode = (String) qrResponse.get("base64");
                }
            }

            ChatbotConfig saved = chatbotConfigRepository.save(config);
            ChatbotConfigDTO dto = mapToDTO(saved);
            dto.setQrCode(qrCode);
            return dto;

        } catch (Exception e) {
            // If instance already exists, try to fetch QR
            if (e.getMessage().contains("already exists")) {
                try {
                    java.util.Map<String, Object> qrResponse = evolutionApiService
                            .fetchQrCode(config.getInstanceName());
                    ChatbotConfig saved = chatbotConfigRepository.save(config);
                    ChatbotConfigDTO dto = mapToDTO(saved);
                    if (qrResponse != null && qrResponse.containsKey("base64")) {
                        dto.setQrCode((String) qrResponse.get("base64"));
                    }
                    return dto;
                } catch (Exception ex) {
                    throw new RuntimeException("Failed to activate chatbot: " + ex.getMessage());
                }
            }
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
