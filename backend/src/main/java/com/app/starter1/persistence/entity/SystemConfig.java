package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Configuración global del sistema CloudFly
 * Solo debe existir 1 registro
 */
@Entity
@Table(name = "system_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==========================================
    // CONFIGURACIÓN GENERAL
    // ==========================================

    @Column(length = 200)
    private String systemName;

    @Column(length = 500)
    private String systemDescription;

    @Column(length = 500)
    private String logoUrl;

    @Column(length = 100)
    private String supportEmail;

    @Column(length = 50)
    private String supportPhone;

    @Column(columnDefinition = "TEXT")
    private String termsOfService;

    @Column(columnDefinition = "TEXT")
    private String privacyPolicy;

    // ==========================================
    // INTEGRACIÓN FACEBOOK
    // ==========================================

    @Column(length = 100)
    private String facebookAppId;

    @Column(columnDefinition = "TEXT")
    private String facebookAppSecret;

    @Column(length = 500)
    private String facebookRedirectUri;

    @Column(length = 200)
    private String facebookWebhookVerifyToken;

    @Column(length = 100)
    private String facebookApiVersion;

    @Builder.Default
    @Column(nullable = false)
    private Boolean facebookEnabled = false;

    // ==========================================
    // INTEGRACIÓN EVOLUTION API (WhatsApp)
    // ==========================================

    @Column(length = 500)
    private String evolutionApiUrl;

    @Column(columnDefinition = "TEXT")
    private String evolutionApiKey;

    @Builder.Default
    @Column(nullable = false)
    private Boolean whatsappEnabled = false;

    // ==========================================
    // AUDITORÍA
    // ==========================================

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(length = 100)
    private String lastUpdatedBy; // Email del admin que actualizó
}
