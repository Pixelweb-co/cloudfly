package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("companies")
public class CompanyEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    private String name;

    private String nit;

    private String address;

    private String phone;
    
    private String email;
    
    private String contact;
    
    private String position;

    @Column("logo_url")
    private String logoUrl;

    private Boolean status;

    @Column("is_principal")
    private Boolean isPrincipal;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Explicit getters for VPS build
    public Long getId() { return id; }
    public Boolean getIsPrincipal() { return isPrincipal; }
}
