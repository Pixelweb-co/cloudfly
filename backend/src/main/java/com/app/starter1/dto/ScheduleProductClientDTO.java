package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScheduleProductClientDTO {
    // Campos de Schedule
    private Long id;
    private String date;
    private String status;

    // Campos de Product
    private String brand;
    private String model;
    private String nombreProducto;
    private String placaProducto;

    // Campo de Cliente
    private String nombreCliente;
}
