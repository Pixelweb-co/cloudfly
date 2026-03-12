package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.relational.core.mapping.Table;

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
}
