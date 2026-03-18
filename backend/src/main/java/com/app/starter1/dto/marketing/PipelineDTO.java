package com.app.starter1.dto.marketing;

import com.app.starter1.persistence.entity.PipelineType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PipelineDTO {
    private Long id;
    private Long tenantId;
    private String name;
    private String description;
    private PipelineType type;
    private String color;
    private String icon;
    private Boolean isActive;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private List<PipelineStageDTO> stages;
}
