package com.app.dto;

import com.app.persistence.entity.WorkflowEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowPaginatedResponse {
    private List<WorkflowEntity> items;
    private long totalItems;
    private int page;
    private int size;
}
