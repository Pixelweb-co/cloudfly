package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineStageDto {
    private Long id;
    private Long pipelineId;
    private String name;
    private String description;
    private String color;
    private Integer position;
    private Boolean isInitial;
    private Boolean isFinal;
    private String outcome;
    private Integer timeoutHours;
}
