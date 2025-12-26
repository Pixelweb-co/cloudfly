package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "channels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ChannelType type;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isConnected = false;

    // Configuración específica por tipo de canal
    @Column(length = 50)
    private String phoneNumber; // WhatsApp

    @Column(length = 100)
    private String pageId; // Facebook

    @Column(length = 100)
    private String username; // Instagram, TikTok

    @Column(length = 500)
    private String accessToken; // Facebook, Instagram, TikTok

    @Column(length = 100)
    private String instanceName; // WhatsApp (nombre de la instancia)

    @Column(length = 500)
    private String webhookUrl; // URL del webhook para recibir mensajes

    @Column(columnDefinition = "TEXT")
    private String apiKey; // API key para servicios externos

    @Column(columnDefinition = "TEXT")
    private String configuration; // JSON con configuración adicional

    @Column
    private LocalDateTime lastSync; // Última sincronización exitosa

    @Column(length = 500)
    private String lastError; // Último error de conexión

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum ChannelType {
        WHATSAPP,
        FACEBOOK,
        INSTAGRAM,
        TIKTOK
    }
}
