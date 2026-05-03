package com.app.persistence.entity;

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
    private String status; // enum: DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED, CANCELLED, FAILED

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
    private String mediaType; // enum: IMAGE, VIDEO, AUDIO, DOCUMENT

    @Column("media_caption")
    private String mediaCaption;

    @Column("product_id")
    private Long productId;

    @Column("category_id")
    private Long categoryId;

    @Column("total_sent")
    private Integer totalSent;

    @Column("total_delivered")
    private Integer totalDelivered;

    @Column("total_read")
    private Integer totalRead;

    @Column("total_failed")
    private Integer totalFailed;

    @Column("scheduled_at")
    private LocalDateTime scheduledAt;

    @Column("started_at")
    private LocalDateTime startedAt;

    @Column("completed_at")
    private LocalDateTime completedAt;

    @Column("created_by")
    private Long createdBy;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    private String recurrence; // NONE, DAILY, WEEKLY, MONTHLY

    // Explicit Getters and Setters for VPS compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getChannelId() { return channelId; }
    public void setChannelId(Long channelId) { this.channelId = channelId; }
    public Long getSendingListId() { return sendingListId; }
    public void setSendingListId(Long sendingListId) { this.sendingListId = sendingListId; }
    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }
    public String getPipelineStage() { return pipelineStage; }
    public void setPipelineStage(String pipelineStage) { this.pipelineStage = pipelineStage; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getMediaCaption() { return mediaCaption; }
    public void setMediaCaption(String mediaCaption) { this.mediaCaption = mediaCaption; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public Integer getTotalSent() { return totalSent; }
    public void setTotalSent(Integer totalSent) { this.totalSent = totalSent; }
    public Integer getTotalDelivered() { return totalDelivered; }
    public void setTotalDelivered(Integer totalDelivered) { this.totalDelivered = totalDelivered; }
    public Integer getTotalRead() { return totalRead; }
    public void setTotalRead(Integer totalRead) { this.totalRead = totalRead; }
    public Integer getTotalFailed() { return totalFailed; }
    public void setTotalFailed(Integer totalFailed) { this.totalFailed = totalFailed; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
