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
@Table("campaigns")
public class CampaignEntity {
    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    private String name;
    private String description;
    private String status;

    @Column("channel_id")
    private Long channelId;

    @Column("sending_list_id")
    private Long sendingListId;

    @Column("pipeline_id")
    private Long pipelineId;

    @Column("pipeline_stage")
    private String pipelineStage;

    private String message;

    @Column("media_url")
    private String mediaUrl;

    @Column("media_type")
    private String mediaType;

    @Column("media_caption")
    private String mediaCaption;

    @Column("product_id")
    private Long productId;

    @Column("category_id")
    private Long categoryId;

    @Column("total_sent")
    private Integer totalSent;

    @Column("total_failed")
    private Integer totalFailed;
}
