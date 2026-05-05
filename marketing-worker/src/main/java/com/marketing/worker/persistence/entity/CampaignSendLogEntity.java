package com.marketing.worker.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("campaign_send_logs")
public class CampaignSendLogEntity {
    @Id
    private Long id;

    @Column("campaign_id")
    private Long campaignId;

    @Column("contact_id")
    private Long contactId;

    private String destination;
    private String status; // enum: PENDING, SENT, DELIVERED, READ, FAILED, SKIPPED

    @Column("error_message")
    private String errorMessage;

    @Column("provider_message_id")
    private String providerMessageId;

    @Column("sent_at")
    private LocalDateTime sentAt;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
