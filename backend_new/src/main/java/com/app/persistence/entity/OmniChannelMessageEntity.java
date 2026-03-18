package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("omni_channel_messages")
public class OmniChannelMessageEntity {
    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("internal_conversation_id")
    private String internalConversationId;

    @Column("contact_id")
    private Long contactId;

    @Column("from_user_id")
    private Long fromUserId;

    private String direction; // INBOUND, OUTBOUND
    
    @Column("message_type")
    private String messageType; // TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, STICKER
    
    private String body;
    
    @Column("media_url")
    private String mediaUrl;
    
    private String platform; // WHATSAPP, FACEBOOK, INSTAGRAM
    private String provider; // EVOLUTION
    
    @Column("external_message_id")
    private String externalMessageId;
    
    private String status; // PENDING, SENT, DELIVERED, READ, FAILED
    
    @Column("sent_at")
    private LocalDateTime sentAt;
    
    @Column("delivered_at")
    private LocalDateTime deliveredAt;
    
    @Column("read_at")
    private LocalDateTime readAt;
    
    @Column("created_at")
    private LocalDateTime createdAt;
}
