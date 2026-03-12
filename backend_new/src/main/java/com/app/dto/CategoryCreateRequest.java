package com.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryCreateRequest {
    @NotBlank(message = "El nombre de la categoría es obligatorio")
    private String nombreCategoria;
    private String description;
    private Long parentCategory;
    private Boolean status;
}
