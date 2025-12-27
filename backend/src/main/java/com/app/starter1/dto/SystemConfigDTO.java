package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la configuración del sistema
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigDTO {

    private Long id;

    // ==========================================
    // CONFIGURACIÓN GENERAL
    // ==========================================
    private String systemName;
    private String systemDescription;
    private String logoUrl;
    private String supportEmail;
    private String supportPhone;
    private String termsOfService;
    private String privacyPolicy;

    // ==========================================
    // INTEGRACIÓN FACEBOOK
    // ==========================================
    private String facebookAppId;
    private String facebookAppSecret;
    private String facebookRedirectUri;
    private String facebookWebhookVerifyToken;
    private String facebookApiVersion;
    private Boolean facebookEnabled;

    // ==========================================
    // INTEGRACIÓN EVOLUTION API
    // ==========================================
    private String evolutionApiUrl;
    private String evolutionApiKey;
    private Boolean whatsappEnabled;

    // ==========================================
    // METADATA
    // ==========================================
    private String lastUpdatedBy;
}
