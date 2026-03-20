package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineCreateRequest {
    private String name;
    private String description;
    private String type; // MARKETING, SALES, SUPPORT, CUSTOM
    private String color;
    private String icon;
    private Boolean isDefault;
    private List<PipelineStageCreateRequest> stages;
}
