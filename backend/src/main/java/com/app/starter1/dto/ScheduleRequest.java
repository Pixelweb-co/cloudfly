package com.app.starter1.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScheduleRequest {

    private List<String> fechas;
    private Long deviceId;
}
