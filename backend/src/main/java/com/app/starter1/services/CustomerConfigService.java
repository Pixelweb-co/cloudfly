package com.app.starter1.services;

import com.app.starter1.dto.CustomerConfigDTO;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.CustomerConfig;
import com.app.starter1.persistence.repository.CustomerConfigRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio para gestionar CustomerConfig
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerConfigService {

    private final CustomerConfigRepository customerConfigRepository;
    private final CustomerRepository customerRepository;
    private final UserMethods userMethods;

    /**
     * Obtener configuración del customer actual (tenant autenticado)
     * Si no existe, crea una por defecto
     */
    @Transactional
    public CustomerConfigDTO getCustomerConfig() {
        Long tenantId = userMethods.getTenantId();
        log.info("📋 [CUSTOMER-CONFIG] Fetching config for tenant: {}", tenantId);

        CustomerConfig config = customerConfigRepository.findByCustomerId(tenantId)
                .orElseGet(() -> createDefaultConfig(tenantId));

        return mapToDTO(config);
    }

    /**
     * Obtener configuración SIN enmascarar secretos
     * Para uso interno del backend (OAuth, webhooks, etc.)
     * Usa transacción de escritura porque puede crear config si no existe
     */
    @Transactional
    public CustomerConfigDTO getCustomerConfigInternal(Long tenantId) {
        log.info("🔓 [CUSTOMER-CONFIG] Fetching config (unmasked) for tenant: {}", tenantId);

        CustomerConfig config = customerConfigRepository.findByCustomerId(tenantId)
                .orElseGet(() -> createDefaultConfig(tenantId));

        return mapToDTOUnmasked(config);
    }

    /**
     * Actualizar configuración del customer
     */
    @Transactional
    public CustomerConfigDTO updateCustomerConfig(CustomerConfigDTO dto) {
        Long tenantId = userMethods.getTenantId();
        String userEmail = userMethods.getCurrentUser().getEmail();
        log.info("⚙️ [CUSTOMER-CONFIG] Updating config for tenant: {} by: {}", tenantId, userEmail);

        CustomerConfig config = customerConfigRepository.findByCustomerId(tenantId)
                .orElseGet(() -> createDefaultConfig(tenantId));

        // Actualizar Facebook
        if (dto.getFacebookAppId() != null)
            config.setFacebookAppId(dto.getFacebookAppId());
        if (dto.getFacebookAppSecret() != null && !isMaskedValue(dto.getFacebookAppSecret()))
            config.setFacebookAppSecret(dto.getFacebookAppSecret());
        if (dto.getFacebookLoginConfigId() != null)
            config.setFacebookLoginConfigId(dto.getFacebookLoginConfigId());
        if (dto.getFacebookEnabled() != null)
            config.setFacebookEnabled(dto.getFacebookEnabled());

        // Actualizar Instagram
        if (dto.getInstagramAppId() != null)
            config.setInstagramAppId(dto.getInstagramAppId());
        if (dto.getInstagramLoginConfigId() != null)
            config.setInstagramLoginConfigId(dto.getInstagramLoginConfigId());
        if (dto.getInstagramEnabled() != null)
            config.setInstagramEnabled(dto.getInstagramEnabled());

        // Actualizar WhatsApp
        if (dto.getEvolutionApiUrl() != null)
            config.setEvolutionApiUrl(dto.getEvolutionApiUrl());
        if (dto.getEvolutionApiKey() != null && !isMaskedValue(dto.getEvolutionApiKey()))
            config.setEvolutionApiKey(dto.getEvolutionApiKey());
        if (dto.getEvolutionInstanceName() != null)
            config.setEvolutionInstanceName(dto.getEvolutionInstanceName());
        if (dto.getWhatsappEnabled() != null)
            config.setWhatsappEnabled(dto.getWhatsappEnabled());

        // Actualizar TikTok
        if (dto.getTiktokAppId() != null)
            config.setTiktokAppId(dto.getTiktokAppId());
        if (dto.getTiktokAppSecret() != null && !isMaskedValue(dto.getTiktokAppSecret()))
            config.setTiktokAppSecret(dto.getTiktokAppSecret());
        if (dto.getTiktokEnabled() != null)
            config.setTiktokEnabled(dto.getTiktokEnabled());

        // Custom
        if (dto.getCustomIntegrationsJson() != null)
            config.setCustomIntegrationsJson(dto.getCustomIntegrationsJson());

        config.setLastUpdatedBy(userEmail);

        CustomerConfig saved = customerConfigRepository.save(config);

        log.info("✅ [CUSTOMER-CONFIG] Configuration updated successfully for tenant: {}", tenantId);

        return mapToDTO(saved);
    }

    /**
     * Crear configuración por defecto para un tenant
     */
    private CustomerConfig createDefaultConfig(Long tenantId) {
        log.info("🆕 [CUSTOMER-CONFIG] Creating default config for tenant: {}", tenantId);

        Customer customer = customerRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + tenantId));

        CustomerConfig config = CustomerConfig.builder()
                .customer(customer)
                .facebookEnabled(false)
                .instagramEnabled(false)
                .whatsappEnabled(false)
                .tiktokEnabled(false)
                .build();

        return customerConfigRepository.save(config);
    }

    /**
     * Mapear entidad a DTO (con secretos enmascarados)
     */
    private CustomerConfigDTO mapToDTO(CustomerConfig entity) {
        return CustomerConfigDTO.builder()
                .id(entity.getId())
                .customerId(entity.getCustomer().getId())
                .facebookAppId(entity.getFacebookAppId())
                .facebookAppSecret(maskSecret(entity.getFacebookAppSecret()))
                .facebookLoginConfigId(entity.getFacebookLoginConfigId())
                .facebookEnabled(entity.getFacebookEnabled())
                .instagramAppId(entity.getInstagramAppId())
                .instagramLoginConfigId(entity.getInstagramLoginConfigId())
                .instagramEnabled(entity.getInstagramEnabled())
                .evolutionApiUrl(entity.getEvolutionApiUrl())
                .evolutionApiKey(maskSecret(entity.getEvolutionApiKey()))
                .evolutionInstanceName(entity.getEvolutionInstanceName())
                .whatsappEnabled(entity.getWhatsappEnabled())
                .tiktokAppId(entity.getTiktokAppId())
                .tiktokAppSecret(maskSecret(entity.getTiktokAppSecret()))
                .tiktokEnabled(entity.getTiktokEnabled())
                .customIntegrationsJson(entity.getCustomIntegrationsJson())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lastUpdatedBy(entity.getLastUpdatedBy())
                .usesSharedFacebookApp(entity.usesSharedFacebookApp())
                .usesSharedEvolutionApi(entity.usesSharedEvolutionApi())
                .isFacebookLoginConfigured(entity.isFacebookLoginConfigured())
                .isInstagramLoginConfigured(entity.isInstagramLoginConfigured())
                .build();
    }

    /**
     * Mapear entidad a DTO (SIN enmascarar secretos)
     */
    private CustomerConfigDTO mapToDTOUnmasked(CustomerConfig entity) {
        return CustomerConfigDTO.builder()
                .id(entity.getId())
                .customerId(entity.getCustomer().getId())
                .facebookAppId(entity.getFacebookAppId())
                .facebookAppSecret(entity.getFacebookAppSecret()) // SIN MÁSCARA
                .facebookLoginConfigId(entity.getFacebookLoginConfigId())
                .facebookEnabled(entity.getFacebookEnabled())
                .instagramAppId(entity.getInstagramAppId())
                .instagramLoginConfigId(entity.getInstagramLoginConfigId())
                .instagramEnabled(entity.getInstagramEnabled())
                .evolutionApiUrl(entity.getEvolutionApiUrl())
                .evolutionApiKey(entity.getEvolutionApiKey()) // SIN MÁSCARA
                .evolutionInstanceName(entity.getEvolutionInstanceName())
                .whatsappEnabled(entity.getWhatsappEnabled())
                .tiktokAppId(entity.getTiktokAppId())
                .tiktokAppSecret(entity.getTiktokAppSecret()) // SIN MÁSCARA
                .tiktokEnabled(entity.getTiktokEnabled())
                .customIntegrationsJson(entity.getCustomIntegrationsJson())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lastUpdatedBy(entity.getLastUpdatedBy())
                .usesSharedFacebookApp(entity.usesSharedFacebookApp())
                .usesSharedEvolutionApi(entity.usesSharedEvolutionApi())
                .isFacebookLoginConfigured(entity.isFacebookLoginConfigured())
                .isInstagramLoginConfigured(entity.isInstagramLoginConfigured())
                .build();
    }

    /**
     * Enmascarar secretos
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

    /**
     * Verificar si un valor está enmascarado
     */
    private boolean isMaskedValue(String value) {
        return value.contains("********") || value.contains("...");
    }
}
