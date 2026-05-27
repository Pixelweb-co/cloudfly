package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDto {
    private Long id;
    private Long tenantId;
    private Long companyId;
    private String name;
    private String color;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
