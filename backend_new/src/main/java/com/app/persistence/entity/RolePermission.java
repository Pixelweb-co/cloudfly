package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("role_permissions")
public class RolePermission {
    @Column("role_id")
    private Long roleId;

    @Column("permission_id")
    private Long permissionId;
}
