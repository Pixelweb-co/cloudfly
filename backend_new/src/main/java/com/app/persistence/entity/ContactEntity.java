package com.app.persistence.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("contacts")
public class ContactEntity {
    @Id
    private Long id;

    private String uuid;
    private String name;
    private String email;
    private String phone;
    private String address;

    @Column("tax_id")
    private String taxId;

    private String type; 
    private String stage;

    @Column("avatar_url")
    private String avatarUrl;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("pipeline_id")
    private Long pipelineId;

    @Column("stage_id")
    private Long stageId;

    @Column("document_type")
    private String documentType;

    @Column("document_number")
    private String documentNumber;

    @Column("is_active")
    @JsonProperty("isActive")
    private Boolean isActive; // Boolean Object is safer for Spring Data R2DBC mapping

    @Column("chatbot_enabled")
    @JsonProperty("chatbotEnabled")
    private Boolean chatbotEnabled;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    // NO EXPLICIT GETTERS/SETTERS - Let Lombok @Data handle it consistently.
    // getIsActive() and setIsActive() will be generated for Boolean isActive.
}
