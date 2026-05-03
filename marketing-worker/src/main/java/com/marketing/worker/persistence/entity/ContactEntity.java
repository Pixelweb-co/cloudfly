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
@Table("contacts")
public class ContactEntity {
    @Id
    private Long id;

    private String name;
    private String email;
    private String phone;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("pipeline_id")
    private Long pipelineId;

    @Column("stage_id")
    private Long stageId;

    @Column("is_active")
    private Boolean isActive;
}
