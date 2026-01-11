package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Configuración específica de integraciones por Customer/Tenant
 * Separada de Customer para mantener concerns claros:
 * - Customer: datos del negocio, DIAN, facturación
 * - CustomerConfig: integraciones API, canales, OAuth
 */
@Entity
@Table(name = "customer_config", indexes = {
        @Index(name = "idx_customer_config_customer", columnList = "customer_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Relación 1:1 con Customer
     * Un Customer tiene exactamente una configuración
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    // ==========================================
    // FACEBOOK MESSENGER
    // ==========================================

    /**
     * Facebook App ID específico del tenant
     * Si es null, usa el del SystemConfig (compartido)
     */
    @Column(name = "facebook_app_id", length = 100)
    private String facebookAppId;

    /**
     * Facebook App Secret específico del tenant
     * Si es null, usa el del SystemConfig (compartido)
     */
    @Column(name = "facebook_app_secret", columnDefinition = "TEXT")
    private String facebookAppSecret;

    /**
     * Configuration ID de "Facebook Login for Business"
     * Se obtiene del panel de Meta al crear una configuración
     * Ejemplo: "123456789012345"
     */
    @Column(name = "facebook_login_config_id", length = 100)
    private String facebookLoginConfigId;

    /**
     * Indica si este tenant tiene Facebook habilitado
     */
    @Builder.Default
    @Column(name = "facebook_enabled", nullable = false)
    private Boolean facebookEnabled = false;

    // ==========================================
    // INSTAGRAM DIRECT
    // ==========================================

    /**
     * Instagram App ID específico del tenant
     * Si es null, usa el del Facebook App (mismo ecosystem)
     */
    @Column(name = "instagram_app_id", length = 100)
    private String instagramAppId;

    /**
     * Configuration ID de Instagram para "Facebook Login for Business"
     */
    @Column(name = "instagram_login_config_id", length = 100)
    private String instagramLoginConfigId;

    /**
     * Indica si este tenant tiene Instagram habilitado
     */
    @Builder.Default
    @Column(name = "instagram_enabled", nullable = false)
    private Boolean instagramEnabled = false;

    // ==========================================
    // WHATSAPP BUSINESS (Evolution API)
    // ==========================================

    /**
     * URL de Evolution API específica del tenant
     * Si es null, usa la del SystemConfig (compartida)
     */
    @Column(name = "evolution_api_url", length = 500)
    private String evolutionApiUrl;

    /**
     * API Key de Evolution API específica del tenant
     * Si es null, usa la del SystemConfig (compartida)
     */
    @Column(name = "evolution_api_key", columnDefinition = "TEXT")
    private String evolutionApiKey;

    /**
     * Nombre de instancia en Evolution API
     * Generalmente: cloudfly_{customerId}
     */
    @Column(name = "evolution_instance_name", length = 100)
    private String evolutionInstanceName;

    /**
     * Indica si este tenant tiene WhatsApp habilitado
     */
    @Builder.Default
    @Column(name = "whatsapp_enabled", nullable = false)
    private Boolean whatsappEnabled = false;

    // ==========================================
    // TIKTOK BUSINESS
    // ==========================================

    /**
     * TikTok App ID del tenant
     */
    @Column(name = "tiktok_app_id", length = 100)
    private String tiktokAppId;

    /**
     * TikTok App Secret del tenant
     */
    @Column(name = "tiktok_app_secret", columnDefinition = "TEXT")
    private String tiktokAppSecret;

    /**
     * Indica si este tenant tiene TikTok habilitado
     */
    @Builder.Default
    @Column(name = "tiktok_enabled", nullable = false)
    private Boolean tiktokEnabled = false;

    // ==========================================
    // OTRAS INTEGRACIONES FUTURAS
    // ==========================================

    /**
     * Configuración JSON para integraciones customizadas
     * Permite agregar nuevas integraciones sin cambiar el schema
     */
    @Column(name = "custom_integrations_json", columnDefinition = "TEXT")
    private String customIntegrationsJson;

    // ==========================================
    // AUDITORÍA
    // ==========================================

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_updated_by", length = 100)
    private String lastUpdatedBy; // Email del usuario que actualizó

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    /**
     * Verifica si debe usar la configuración de Facebook del SystemConfig
     * o tiene su propia configuración
     */
    public boolean usesSharedFacebookApp() {
        return facebookAppId == null || facebookAppSecret == null;
    }

    /**
     * Verifica si debe usar la configuración de Evolution API del SystemConfig
     * o tiene su propia configuración
     */
    public boolean usesSharedEvolutionApi() {
        return evolutionApiUrl == null || evolutionApiKey == null;
    }

    /**
     * Verifica si Facebook Login for Business está completamente configurado
     */
    public boolean isFacebookLoginConfigured() {
        return facebookLoginConfigId != null &&
                !facebookLoginConfigId.isEmpty() &&
                facebookEnabled;
    }

    /**
     * Verifica si Instagram Login for Business está completamente configurado
     */
    public boolean isInstagramLoginConfigured() {
        return instagramLoginConfigId != null &&
                !instagramLoginConfigId.isEmpty() &&
                instagramEnabled;
    }
}
