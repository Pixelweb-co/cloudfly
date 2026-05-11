package com.app.dto;

import com.app.persistence.entity.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlotDto {
    private Long id;
    private Long tenantId;
    private Long companyId;
    private Long userId;
    private Long templateId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private EventStatus status;
    private Long appointmentId;
    
    // Enriched fields
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String appointmentTitle;
    private String appointmentChannel;
}
