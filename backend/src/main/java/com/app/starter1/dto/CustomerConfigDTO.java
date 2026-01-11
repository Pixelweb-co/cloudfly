package com.app.starter1.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO para CustomerConfig
 * Maneja la configuración de integraciones por tenant
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerConfigDTO {

    private Long id;
    private Long customerId;

    // Facebook
    private String facebookAppId;
    private String facebookAppSecret; // Será enmascarado al leer
    private String facebookLoginConfigId;
    private Boolean facebookEnabled;

    // Instagram
    private String instagramAppId;
    private String instagramLoginConfigId;
    private Boolean instagramEnabled;

    // WhatsApp (Evolution API)
    private String evolutionApiUrl;
    private String evolutionApiKey; // Será enmascarado al leer
    private String evolutionInstanceName;
    private Boolean whatsappEnabled;

    // TikTok
    private String tiktokAppId;
    private String tiktokAppSecret; // Será enmascarado al leer
    private Boolean tiktokEnabled;

    // Custom
    private String customIntegrationsJson;

    // Auditoría
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String lastUpdatedBy;

    // Helpers
    private Boolean usesSharedFacebookApp;
    private Boolean usesSharedEvolutionApi;
    private Boolean isFacebookLoginConfigured;
    private Boolean isInstagramLoginConfigured;
}
