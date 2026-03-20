package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineStageCreateRequest {
    private Long id; // Para actualizaciones
    private String name;
    private String description;
    private String color;
    private Integer position;
    private Boolean isInitial;
    private Boolean isFinal;
    private String outcome; // WON, LOST, OPEN
    private Integer timeoutHours;
}
