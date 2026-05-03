package com.marketing.worker.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("channel_configs")
public class ChannelConfig {
    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("instance_name")
    private String instanceName;

    @Column("api_key")
    private String apiKey;

    @Column("is_active")
    private Boolean isActive;
}
