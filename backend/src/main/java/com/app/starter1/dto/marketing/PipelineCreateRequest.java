package com.app.starter1.dto.marketing;

import com.app.starter1.persistence.entity.PipelineType;
import lombok.Data;

import java.util.List;

@Data
public class PipelineCreateRequest {
    private String name;
    private String description;
    private PipelineType type;
    private String color;
    private String icon;
    private Boolean isDefault;
    private List<PipelineStageCreateRequest> stages;
}
