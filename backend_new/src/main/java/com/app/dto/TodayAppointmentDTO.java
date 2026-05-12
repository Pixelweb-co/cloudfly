package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodayAppointmentDTO {
    private Long id;
    private String contactName;
    private String time;
    private String service;
    private String status;
}
