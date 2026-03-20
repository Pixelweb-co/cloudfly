package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineDto {
    private Long id;
    private Long tenantId;
    private String name;
    private String description;
    private String type;
    private String color;
    private String icon;
    private Boolean isActive;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private List<PipelineStageDto> stages;
}
