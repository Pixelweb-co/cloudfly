package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("user_roles")
public class UserRole {
    @Column("user_id")
    private Long userId;

    @Column("role_id")
    private Long roleId;

    public UserRole() {}
    public UserRole(Long userId, Long roleId) {
        this.userId = userId;
        this.roleId = roleId;
    }
}
