package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "omni_channel_messages", indexes = {
        @Index(name = "idx_msg_tenant_contact", columnList = "tenant_id, contact_id"),
        @Index(name = "idx_msg_tenant_conv", columnList = "tenant_id, internal_conversation_id"),
        @Index(name = "idx_msg_platform_conv", columnList = "platform, external_conversation_id"),
        @Index(name = "idx_msg_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OmniChannelMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =======================
    // MULTITENANT + CONTACTO
    // =======================

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // tu contacto interno (lead/cliente/etc.)
    @Column(name = "contact_id")
    private Long contactId;

    // ID de la conversación interna (ej: chat principal con ese contacto)
    @Column(name = "internal_conversation_id", length = 100)
    private String internalConversationId;

    // =======================
    // INTEGRACIÓN / INSTANCIA
    // =======================

    // Ej: "evolution-equibiomedic-01", "fb-page-123", "ig-account-xyz"
    @Column(name = "integration_key", length = 150)
    private String integrationKey;

    // Proveedor genérico: EVOLUTION, META, TELEGRAM, CUSTOM, etc.
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", length = 30, nullable = false)
    private MessageProvider provider;

    // Plataforma/canal: WHATSAPP, FACEBOOK_MESSENGER, INSTAGRAM_DM, TELEGRAM,
    // WEBCHAT, EMAIL, SMS...
    @Enumerated(EnumType.STRING)
    @Column(name = "platform", length = 40, nullable = false)
    private MessagePlatform platform;

    // =======================
    // IDS EXTERNOS
    // =======================

    // ID del chat/hilo en la plataforma (remoteJid en WA, PSID+threadid en FB,
    // chat_id en Telegram, etc.)
    @Column(name = "external_conversation_id", length = 200)
    private String externalConversationId;

    // ID del mensaje en la plataforma
    @Column(name = "external_message_id", length = 200)
    private String externalMessageId;

    // ID del mensaje citado (reply), si aplica
    @Column(name = "external_quoted_message_id", length = 200)
    private String externalQuotedMessageId;

    // =======================
    // DIRECCIÓN / PARTICIPANTES
    // =======================

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", length = 20, nullable = false)
    private MessageDirection direction; // INBOUND / OUTBOUND

    // Identificadores externos de quién envía/recibe (userId, phone, psid, etc.)
    @Column(name = "external_sender_id", length = 200)
    private String externalSenderId;

    @Column(name = "external_recipient_id", length = 200)
    private String externalRecipientId;

    // Usuario interno que envía (cuando es OUTBOUND)
    @Column(name = "from_user_id")
    private Long fromUserId;

    // =======================
    // CONTENIDO
    // =======================

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", length = 30, nullable = false)
    private MessageType messageType = MessageType.TEXT;

    // Texto plano (conversation, caption, body, etc.)
    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    // URL o path donde guardas media (imagen, audio, documento, etc.)
    @Column(name = "media_url", length = 500)
    private String mediaUrl;

    // Título, caption u otro campo textual corto opcional
    @Column(name = "title", length = 255)
    private String title;

    // Datos extra en JSON (botones, quick_replies, opciones, coordenadas, etc.)
    @Column(name = "extra_data", columnDefinition = "TEXT")
    private String extraData;

    // Nombre que envía la plataforma (pushName, displayName, etc.)
    @Column(name = "display_name", length = 255)
    private String displayName;

    // =======================
    // ESTADO Y TIEMPOS
    // =======================

    // Timestamp de la plataforma (cuando según la red se envió el mensaje)
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    // Cuando lo guardaste tú
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private MessageStatus status = MessageStatus.SENT;

    // =======================
    // RAW PAYLOAD
    // =======================

    // JSON completo del webhook de la red social (para debug/auditoría)
    @Column(name = "raw_payload", columnDefinition = "TEXT")
    private String rawPayload;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }
}
