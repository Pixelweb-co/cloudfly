package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("web_notifications")
public class WebNotificationEntity {
    @Id
    @Column("uuid")
    private String id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("user_id")
    private Long userId;

    @Column("title")
    private String title;

    @Column("description")
    private String description;

    @Column("type")
    private String type;

    @Column("status")
    private String status; // UNREAD, READ, DELETED

    @Column("created_at")
    private LocalDateTime createdAt;
}
