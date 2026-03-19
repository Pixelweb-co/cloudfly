package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("pipelines")
public class PipelineEntity {
    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    private String name;
    private String description;
    private String type; // MARKETING, SALES, SUPPORT, CUSTOM
    private String color;
    private String icon;

    @Column("is_active")
    private boolean isActive;

    @Column("is_default")
    private boolean isDefault;

    @Column("created_by")
    private Long createdBy;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
