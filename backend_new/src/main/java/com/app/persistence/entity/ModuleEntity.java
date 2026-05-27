package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

/**
 * ModuleEntity - Reactive entity for system modules
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("modules")
public class ModuleEntity {

    @Id
    private Long id;

    private String code;

    private String name;

    private String description;

    private String icon;

    @Column("menu_path")
    private String menuPath;

    @Column("display_order")
    private Integer displayOrder;

    @Column("is_active")
    private Boolean isActive;

    @Column("menu_items")
    private String menuItems;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
