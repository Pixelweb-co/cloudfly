package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Table("tenant_agent_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAgentConfig {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("global_agent_id")
    private Long globalAgentId; // Templates (Ventas, Soporte, Agendamiento)

    @Column("display_name")
    private String displayName; // Custom name (e.g. Claudia)

    @Column("company_specific_context")
    private String companySpecificContext; // The personalization (Company rules, products)

    private Boolean isActive;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
