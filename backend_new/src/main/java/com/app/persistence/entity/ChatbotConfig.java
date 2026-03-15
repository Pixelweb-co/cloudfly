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

@Table("chatbot_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotConfig {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("instance_name")
    private String instanceName;

    @Column("chatbot_type")
    private ChatbotType chatbotType;

    @Column("is_active")
    private Boolean isActive;

    @Column("n8n_webhook_url")
    private String n8nWebhookUrl;

    private String context;

    @Column("agent_name")
    private String agentName;

    @Column("api_key")
    private String apiKey;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
