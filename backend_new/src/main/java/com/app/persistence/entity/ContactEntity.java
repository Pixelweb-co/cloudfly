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

    private String type; // Enums are better handled as strings in R2DBC sometimes, or via converter

    private String stage;

    @Column("avatar_url")
    private String avatarUrl;

    @Column("tenant_id")
    private Long tenantId;

    @Column("is_active")
    private boolean isActive;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
