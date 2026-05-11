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
@Table("appointments")
public class AppointmentEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("user_id")
    private Long userId;

    @Column("contact_id")
    private Long contactId;

    @Column("service_id")
    private Long serviceId;

    @Column("slot_id")
    private Long slotId;

    private String title;
    private String description;
    private String observations;

    @Column("appointment_type")
    private String appointmentType;

    private String channel; // presencial, videollamada, llamada, WhatsApp

    private EventStatus status;

    @Column("start_time")
    private LocalDateTime startTime;

    @Column("end_time")
    private LocalDateTime endTime;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
