package com.app.starter1.dto;

import jakarta.validation.constraints.NotBlank;


public record CategoryCreateRequest(
        @NotBlank(message = "El nombre del categoria es requerido") 
        String nombreCategoria,
        
        String description,
        
        Long parentCategory,
        Long tenantId,

        Boolean status
) {
}
