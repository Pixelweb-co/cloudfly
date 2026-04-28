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

    @Column("channel_id")
    private Long channelId;

    @Column("contact_id")
    private Long contactId;

    private String direction; // INBOUND, OUTBOUND
    
    @Column("content")
    private String body;
    
    @Column("media_url")
    private String mediaUrl;

    @Column("media_type")
    private String mediaType;
    
    @Column("external_msg_id")
    private String externalMessageId;
    
    private String status; // PENDING, SENT, DELIVERED, READ, FAILED
    
    @Column("created_at")
    private LocalDateTime createdAt;
}
