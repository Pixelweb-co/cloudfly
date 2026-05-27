package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineStageStatsDTO {
    private Long stageId;
    private String name;
    private String color;
    private Integer contactCount;
    private int position;
}
