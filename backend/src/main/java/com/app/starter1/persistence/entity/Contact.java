package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String email;

    private String phone;

    private String address;

    private String taxId; // RUC, DNI, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactType type;

    // Stage for Kanban board: LEAD, POTENTIAL, CLIENT
    @Column(length = 50)
    private String stage = "LEAD";

    // Avatar/profile picture URL
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "tenant_id", nullable = false)
    private Integer tenantId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
