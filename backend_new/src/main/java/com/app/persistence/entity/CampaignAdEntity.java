package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("campaign_ads")
public class CampaignAdEntity {

    @Id
    private Long id;

    @Column("campaign_id")
    private Long campaignId;

    @Column("company_id")
    private Long companyId;

    private String name;
    private String platform; // FACEBOOK, INSTAGRAM, TIKTOK
    private String format; // IMAGE, VIDEO, REEL, CAROUSEL

    @Column("media_url")
    private String mediaUrl;

    @Column("destination_url")
    private String destinationUrl;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
