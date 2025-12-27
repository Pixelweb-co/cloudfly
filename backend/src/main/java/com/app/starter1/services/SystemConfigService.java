package com.app.starter1.services;

import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.persistence.entity.SystemConfig;
import com.app.starter1.persistence.repository.SystemConfigRepository;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final UserMethods userMethods;

    /**
     * Obtener la configuración del sistema
     * Si no existe, crea una por defecto
     */
    @Transactional
    public SystemConfigDTO getSystemConfig() {
        log.info("📋 [SYSTEM-CONFIG] Fetching system configuration");

        SystemConfig config = systemConfigRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultConfig);

        return mapToDTO(config);
    }

    /**
     * Obtener la configuración del sistema SIN enmascarar secretos
     * Para uso INTERNO del backend (webhooks, OAuth, etc.)
     */
    @Transactional(readOnly = true)
    public SystemConfigDTO getSystemConfigInternal() {
        log.info("🔓 [SYSTEM-CONFIG] Fetching system configuration (unmasked)");

        SystemConfig config = systemConfigRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultConfig);

        // Retornar DTO sin enmascarar secretos
        return SystemConfigDTO.builder()
                .id(config.getId())
                .systemName(config.getSystemName())
                .systemDescription(config.getSystemDescription())
                .logoUrl(config.getLogoUrl())
                .supportEmail(config.getSupportEmail())
                .supportPhone(config.getSupportPhone())
                .termsOfService(config.getTermsOfService())
                .privacyPolicy(config.getPrivacyPolicy())
                .facebookAppId(config.getFacebookAppId())
                .facebookAppSecret(config.getFacebookAppSecret()) // SIN MÁSCARA
                .facebookRedirectUri(config.getFacebookRedirectUri())
                .facebookWebhookVerifyToken(config.getFacebookWebhookVerifyToken()) // SIN MÁSCARA
                .facebookApiVersion(config.getFacebookApiVersion())
                .facebookApiVersion(config.getFacebookApiVersion())
                .facebookEnabled(config.getFacebookEnabled())
                .frontendUrl(config.getFrontendUrl())
                .evolutionApiUrl(config.getEvolutionApiUrl())
                .evolutionApiKey(config.getEvolutionApiKey()) // SIN MÁSCARA
                .whatsappEnabled(config.getWhatsappEnabled())
                .lastUpdatedBy(config.getLastUpdatedBy())
                .build();
    }

    /**
     * Actualizar configuración del sistema
     * Solo SUPERADMIN puede hacerlo
     */
    @Transactional
    public SystemConfigDTO updateSystemConfig(SystemConfigDTO dto) {
        String userEmail = userMethods.getCurrentUser().getEmail();
        log.info("⚙️ [SYSTEM-CONFIG] Updating system config by: {}", userEmail);

        SystemConfig config = systemConfigRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> SystemConfig.builder().build());

        // Actualizar configuración general
        if (dto.getSystemName() != null) {
            config.setSystemName(dto.getSystemName());
        }
        if (dto.getSystemDescription() != null) {
            config.setSystemDescription(dto.getSystemDescription());
        }
        if (dto.getLogoUrl() != null) {
            config.setLogoUrl(dto.getLogoUrl());
        }
        if (dto.getSupportEmail() != null) {
            config.setSupportEmail(dto.getSupportEmail());
        }
        if (dto.getSupportPhone() != null) {
            config.setSupportPhone(dto.getSupportPhone());
        }
        if (dto.getTermsOfService() != null) {
            config.setTermsOfService(dto.getTermsOfService());
        }
        if (dto.getPrivacyPolicy() != null) {
            config.setPrivacyPolicy(dto.getPrivacyPolicy());
        }

        // Actualizar integración Facebook
        if (dto.getFacebookAppId() != null) {
            config.setFacebookAppId(dto.getFacebookAppId());
        }
        if (dto.getFacebookAppSecret() != null) {
            config.setFacebookAppSecret(dto.getFacebookAppSecret());
        }
        if (dto.getFacebookRedirectUri() != null) {
            config.setFacebookRedirectUri(dto.getFacebookRedirectUri());
        }
        if (dto.getFacebookWebhookVerifyToken() != null) {
            config.setFacebookWebhookVerifyToken(dto.getFacebookWebhookVerifyToken());
        }
        if (dto.getFacebookApiVersion() != null) {
            config.setFacebookApiVersion(dto.getFacebookApiVersion());
        }
        if (dto.getFacebookEnabled() != null) {
            config.setFacebookEnabled(dto.getFacebookEnabled());
        }
        if (dto.getFrontendUrl() != null) {
            config.setFrontendUrl(dto.getFrontendUrl());
        }

        // Actualizar integración Evolution API
        if (dto.getEvolutionApiUrl() != null) {
            config.setEvolutionApiUrl(dto.getEvolutionApiUrl());
        }
        if (dto.getEvolutionApiKey() != null) {
            config.setEvolutionApiKey(dto.getEvolutionApiKey());
        }
        if (dto.getWhatsappEnabled() != null) {
            config.setWhatsappEnabled(dto.getWhatsappEnabled());
        }

        config.setLastUpdatedBy(userEmail);

        SystemConfig saved = systemConfigRepository.save(config);

        log.info("✅ [SYSTEM-CONFIG] Configuration updated successfully");

        return mapToDTO(saved);
    }

    /**
     * Crear configuración por defecto
     */
    private SystemConfig createDefaultConfig() {
        log.info("🆕 [SYSTEM-CONFIG] Creating default configuration");

        SystemConfig config = SystemConfig.builder()
                .systemName("CloudFly ERP")
                .systemDescription("Sistema ERP Multi-tenant con IA")
                .facebookApiVersion("v18.0")
                .facebookEnabled(false)
                .whatsappEnabled(false)
                .build();

        return systemConfigRepository.save(config);
    }

    /**
     * Mapear entidad a DTO
     */
    private SystemConfigDTO mapToDTO(SystemConfig entity) {
        return SystemConfigDTO.builder()
                .id(entity.getId())
                .systemName(entity.getSystemName())
                .systemDescription(entity.getSystemDescription())
                .logoUrl(entity.getLogoUrl())
                .supportEmail(entity.getSupportEmail())
                .supportPhone(entity.getSupportPhone())
                .termsOfService(entity.getTermsOfService())
                .privacyPolicy(entity.getPrivacyPolicy())
                .facebookAppId(entity.getFacebookAppId())
                .facebookAppSecret(maskSecret(entity.getFacebookAppSecret()))
                .facebookRedirectUri(entity.getFacebookRedirectUri())
                .facebookWebhookVerifyToken(maskSecret(entity.getFacebookWebhookVerifyToken()))
                .facebookApiVersion(entity.getFacebookApiVersion())
                .facebookApiVersion(entity.getFacebookApiVersion())
                .facebookEnabled(entity.getFacebookEnabled())
                .frontendUrl(entity.getFrontendUrl())
                .evolutionApiUrl(entity.getEvolutionApiUrl())
                .evolutionApiKey(maskSecret(entity.getEvolutionApiKey()))
                .whatsappEnabled(entity.getWhatsappEnabled())
                .lastUpdatedBy(entity.getLastUpdatedBy())
                .build();
    }

    /**
     * Enmascarar secretos para no exponerlos completos en GET
     */
    private String maskSecret(String secret) {
        if (secret == null || secret.isEmpty()) {
            return null;
        }

        if (secret.length() <= 8) {
            return "********";
        }

        return secret.substring(0, 4) + "..." + secret.substring(secret.length() - 4);
    }
}
