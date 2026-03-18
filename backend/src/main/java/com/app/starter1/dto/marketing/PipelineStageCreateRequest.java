package com.app.starter1.dto.marketing;

import com.app.starter1.persistence.entity.StageOutcome;
import lombok.Data;

@Data
public class PipelineStageCreateRequest {
    private String name;
    private String description;
    private String color;
    private Integer position;
    private Boolean isInitial;
    private Boolean isFinal;
    private StageOutcome outcome;
    private Integer timeoutHours;
}
