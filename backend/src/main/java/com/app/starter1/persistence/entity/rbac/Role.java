package com.app.starter1.persistence.entity.rbac;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Role Entity - Represents a system role (SUPERADMIN, ADMIN, VENDEDOR, etc.)
 * Roles can be system-wide or tenant-specific
 */
@Entity
@Table(name = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    // Campo legacy para compatibilidad con RoleEntity (RoleEnum)
    @Column(name = "role_name", length = 50)
    private String roleName;

    @Column(name = "is_system")
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "tenant_id")
    private Integer tenantId;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private Set<RolePermission> permissions = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        syncRoleName();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        syncRoleName();
    }

    private void syncRoleName() {
        if (this.code != null) {
            this.roleName = this.code;
        }
    }

    /**
     * Check if role has a specific permission
     */
    public boolean hasPermission(String moduleCode, String actionCode) {
        return permissions.stream()
                .filter(RolePermission::getGranted)
                .anyMatch(rp -> rp.getModuleAction().getModule().getCode().equals(moduleCode) &&
                        rp.getModuleAction().getCode().equals(actionCode));
    }

    /**
     * Check if role has any permission for a module
     */
    public boolean hasModuleAccess(String moduleCode) {
        return permissions.stream()
                .filter(RolePermission::getGranted)
                .anyMatch(rp -> rp.getModuleAction().getModule().getCode().equals(moduleCode));
    }
}
