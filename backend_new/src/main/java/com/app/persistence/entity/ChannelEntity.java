package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("channels")
public class ChannelEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    private String name;

    private String platform; // WHATSAPP, FACEBOOK, INSTAGRAM, TIKTOK, WEB
    private String provider; // EVOLUTION_API, META_API, TWILIO, CUSTOM

    @Column("bot_integration_id")
    private Long botIntegrationId;

    private Boolean status;

    @Column("settings_json")
    private String settingsJson;

    @Column("instance_name")
    private String instanceName;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
