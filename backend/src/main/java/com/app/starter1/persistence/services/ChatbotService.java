package com.app.starter1.persistence.services;

import com.app.starter1.dto.ChatbotConfigDTO;
import com.app.starter1.persistence.entity.ChatbotConfig;
import com.app.starter1.persistence.entity.ChatbotType;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ChatbotConfigRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
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
    private final CustomerRepository customerRepository;

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

        // Auto-generar instanceName si no se proporciona
        String instanceName = dto.getInstanceName();
        if (instanceName == null || instanceName.trim().isEmpty()) {
            instanceName = "cloudfly_" + tenantId;
            log.info("📝 [CHATBOT-SERVICE] Auto-generated instanceName: {}", instanceName);
        }
        config.setInstanceName(instanceName);

        // Si no se proporciona chatbotType, obtenerlo del businessType del Customer
        if (dto.getChatbotType() == null) {
            ChatbotType chatbotType = getChatbotTypeFromCustomer(tenantId);
            config.setChatbotType(chatbotType);
            log.info("📋 [CHATBOT-SERVICE] ChatbotType auto-asignado desde Customer businessType: {}", chatbotType);
        } else {
            config.setChatbotType(dto.getChatbotType());
        }

        config.setIsActive(dto.getIsActive());
        config.setN8nWebhookUrl(dto.getN8nWebhookUrl());
        config.setContext(dto.getContext());
        config.setAgentName(dto.getAgentName());

        ChatbotConfig saved = chatbotConfigRepository.save(config);
        return mapToDTO(saved);
    }

    /**
     * Obtiene el ChatbotType basado en el businessType del Customer
     */
    private ChatbotType getChatbotTypeFromCustomer(Long tenantId) {
        return customerRepository.findById(tenantId)
                .map(customer -> {
                    Customer.BusinessType businessType = customer.getBusinessType();
                    return mapBusinessTypeToChatbotType(businessType);
                })
                .orElse(ChatbotType.SALES); // Por defecto SALES si no se encuentra
    }

    /**
     * Mapea el BusinessType del Customer (enum) al ChatbotType correspondiente
     */
    private ChatbotType mapBusinessTypeToChatbotType(Customer.BusinessType businessType) {
        if (businessType == null) {
            return ChatbotType.SALES;
        }

        return switch (businessType) {
            case VENTAS -> ChatbotType.SALES;
            case AGENDAMIENTO -> ChatbotType.SCHEDULING;
            case SUSCRIPCION -> ChatbotType.SUPPORT; // Usar SUPPORT para suscripciones
            case MIXTO -> ChatbotType.SALES; // Por defecto SALES para mixto
        };
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

    @Transactional(readOnly = true)
    public ChatbotConfigDTO getStatus(Long tenantId) {
        log.info("📊 [CHATBOT-SERVICE] Getting status for tenantId: {}", tenantId);

        // Buscar config en DB
        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId).orElse(null);

        if (config == null) {
            log.info("ℹ️ [CHATBOT-SERVICE] No config found for tenantId: {}", tenantId);
            // No existe configuración
            ChatbotConfigDTO dto = new ChatbotConfigDTO();
            dto.setExists(false);
            dto.setIsConnected(false);
            return dto;
        }

        // Hay config en DB, verificar si existe instancia en Evolution API
        try {
            java.util.Map<String, Object> statusResponse = evolutionApiService
                    .checkInstanceStatus(config.getInstanceName());

            ChatbotConfigDTO dto = mapToDTO(config);

            if (statusResponse != null) {
                // La instancia SÍ existe en Evolution API
                dto.setExists(true);

                // Verificar si está conectado
                Object stateObj = statusResponse.get("state");
                boolean connected = "open".equals(stateObj);
                dto.setIsConnected(connected);

                // Si no está conectado, obtener QR
                if (!connected) {
                    try {
                        java.util.Map<String, Object> qrResponse = evolutionApiService
                                .fetchQrCode(config.getInstanceName());
                        if (qrResponse != null && qrResponse.containsKey("base64")) {
                            dto.setQrCode((String) qrResponse.get("base64"));
                        }
                    } catch (Exception qrEx) {
                        log.warn("⚠️ [CHATBOT-SERVICE] Could not fetch QR: {}", qrEx.getMessage());
                    }
                }

                log.info("✅ [CHATBOT-SERVICE] Status retrieved - exists: true, connected: {}", connected);
            } else {
                // La instancia NO existe en Evolution API
                log.info("ℹ️ [CHATBOT-SERVICE] Instance does not exist in Evolution API");
                dto.setExists(false);
                dto.setIsConnected(false);
            }

            return dto;

        } catch (Exception e) {
            log.info("ℹ️ [CHATBOT-SERVICE] Instance does not exist in Evolution API: {}", e.getMessage());
            // La instancia no existe en Evolution API (404 o error)
            ChatbotConfigDTO dto = mapToDTO(config);
            dto.setExists(false);
            dto.setIsConnected(false);
            return dto;
        }
    }

    @Transactional
    public ChatbotConfigDTO logoutChatbot(Long tenantId) {
        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Chatbot config not found"));

        try {
            evolutionApiService.logoutInstance(config.getInstanceName());
            config.setIsActive(false);
            chatbotConfigRepository.save(config);
            return mapToDTO(config);
        } catch (Exception e) {
            throw new RuntimeException("Failed to logout chatbot: " + e.getMessage());
        }
    }

    @Transactional
    public ChatbotConfigDTO restartChatbot(Long tenantId) {
        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Chatbot config not found"));

        try {
            java.util.Map<String, Object> response = evolutionApiService.restartInstance(config.getInstanceName());
            // Intentar obtener QR después de reiniciar
            try {
                java.util.Map<String, Object> qrResponse = evolutionApiService.fetchQrCode(config.getInstanceName());
                ChatbotConfigDTO dto = mapToDTO(config);
                if (qrResponse != null && qrResponse.containsKey("base64")) {
                    dto.setQrCode((String) qrResponse.get("base64"));
                }
                return dto;
            } catch (Exception qrEx) {
                return mapToDTO(config);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to restart chatbot: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteChatbot(Long tenantId) {
        ChatbotConfig config = chatbotConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Chatbot config not found"));

        try {
            evolutionApiService.deleteInstance(config.getInstanceName());
            chatbotConfigRepository.delete(config);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete chatbot: " + e.getMessage());
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
        dto.setAgentName(entity.getAgentName());
        dto.setApiKey(entity.getApiKey());
        return dto;
    }
}
