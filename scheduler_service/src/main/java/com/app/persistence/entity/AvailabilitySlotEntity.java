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
@Table("availability_slots")
public class AvailabilitySlotEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("user_id")
    private Long userId;

    @Column("template_id")
    private Long templateId;

    @Column("service_id")
    private Long serviceId;

    @Column("start_time")
    private LocalDateTime startTime;

    @Column("end_time")
    private LocalDateTime endTime;

    private EventStatus status;

    @Column("appointment_id")
    private Long appointmentId;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
