package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String nombreCategoria;
    private String description;
    private Long parentCategory;
    private Boolean status;
    private Long tenantId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
