package com.app.starter1.persistence.entity.rbac;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * ModuleAction Entity - Represents actions available in a module (read, create,
 * update, delete, etc.)
 */
@Entity
@Table(name = "module_actions", uniqueConstraints = @UniqueConstraint(columnNames = { "module_id", "code" }))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    @JsonIgnore
    private RbacModule module;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Returns the full permission key (e.g., "pos.read", "accounting.create")
     */
    @Transient
    public String getPermissionKey() {
        return module != null ? module.getCode() + "." + code : code;
    }
}
