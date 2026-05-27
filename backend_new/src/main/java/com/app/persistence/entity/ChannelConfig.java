package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

@Table("channel_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelConfig {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("instance_name")
    private String instanceName;

    @Column("channel_type")
    private ChannelType channelType;

    @Column("is_active")
    private Boolean isActive;

    @Column("n8n_webhook_url")
    private String n8nWebhookUrl;

    @Column("api_key")
    private String apiKey;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Explicit getters for VPS build
    public Long getId() { return id; }
    public String getInstanceName() { return instanceName; }
    public String getN8nWebhookUrl() { return n8nWebhookUrl; }
    public Boolean getIsActive() { return isActive; }
    public Long getTenantId() { return tenantId; }
    public Long getCompanyId() { return companyId; }
}
