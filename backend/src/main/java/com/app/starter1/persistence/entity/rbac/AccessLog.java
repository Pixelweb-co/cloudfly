package com.app.starter1.persistence.entity.rbac;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * AccessLog Entity - Audit log for tracking user actions
 */
@Entity
@Table(name = "access_logs", indexes = {
        @Index(name = "idx_user_access", columnList = "user_id, created_at"),
        @Index(name = "idx_tenant_access", columnList = "tenant_id, created_at"),
        @Index(name = "idx_module_action", columnList = "module_code, action_code"),
        @Index(name = "idx_created", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "tenant_id")
    private Integer tenantId;

    @Column(name = "module_code", length = 50)
    private String moduleCode;

    @Column(name = "action_code", length = 50)
    private String actionCode;

    @Column(name = "resource_type", length = 100)
    private String resourceType;

    @Column(name = "resource_id")
    private Long resourceId;

    @Column(length = 255)
    private String endpoint;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column
    @Builder.Default
    private Boolean success = true;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "request_data", columnDefinition = "JSON")
    private String requestData;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
