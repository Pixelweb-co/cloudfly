package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("roles")
public class RoleEntity {

    @Id
    private Long id;

    @Column("role_name")
    private String name;

    // Explicit getters for VPS build
    public Long getId() { return id; }
    public String getName() { return name; }
}
