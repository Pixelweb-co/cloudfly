package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for DANE geographic codes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DaneCodeDTO {
    private Long id;
    private String tipo; // DEPARTAMENTO or CIUDAD
    private String codigo;
    private String nombre;
    private String codigoDepartamento; // Only for cities
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
