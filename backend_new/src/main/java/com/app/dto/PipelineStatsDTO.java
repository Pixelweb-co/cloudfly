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
public class PipelineStatsDTO {
    private Long pipelineId;
    private String pipelineName;
    private List<PipelineStageStatsDTO> stages;
}
