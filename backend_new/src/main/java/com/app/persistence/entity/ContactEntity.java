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
    private boolean isActive;

    @Column("chatbot_enabled")
    private Boolean chatbotEnabled;

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
    public Boolean getChatbotEnabled() { return chatbotEnabled; }

    // Explicit Setters for VPS Build Stability
    public void setId(Long id) { this.id = id; }
    public void setUuid(String uuid) { this.uuid = uuid; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setAddress(String address) { this.address = address; }
    public void setTaxId(String taxId) { this.taxId = taxId; }
    public void setType(String type) { this.type = type; }
    public void setStage(String stage) { this.stage = stage; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }
    public void setStageId(Long stageId) { this.stageId = stageId; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
    public void setActive(boolean active) { this.isActive = active; }
    public void setChatbotEnabled(Boolean chatbotEnabled) { this.chatbotEnabled = chatbotEnabled; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
