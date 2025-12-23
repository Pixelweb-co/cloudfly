package com.app.starter1.persistence.entity.rbac;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * RolePermission Entity - Links roles to module actions (the actual
 * permissions)
 */
@Entity
@Table(name = "role_module_permissions", uniqueConstraints = @UniqueConstraint(columnNames = { "role_id",
        "module_action_id" }))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_action_id", nullable = false)
    private ModuleAction moduleAction;

    @Column(nullable = false)
    @Builder.Default
    private Boolean granted = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
