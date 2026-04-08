package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("contacts")
public class ContactEntity {
    @Id
    private Long id;

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
    private boolean isActive;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Explicit Getters for VPS Build
    public Long getId() { return id; }
    public Long getTenantId() { return tenantId; }
    public Long getCompanyId() { return companyId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getTaxId() { return taxId; }
    public String getType() { return type; }
    public String getStage() { return stage; }
    public Long getPipelineId() { return pipelineId; }
    public Long getStageId() { return stageId; }
    public String getDocumentType() { return documentType; }
    public String getDocumentNumber() { return documentNumber; }
    public boolean isActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
