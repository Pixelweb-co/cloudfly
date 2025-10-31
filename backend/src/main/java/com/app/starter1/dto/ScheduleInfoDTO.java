package com.app.starter1.dto;

public interface ScheduleInfoDTO {
    // Campos de schedule (todos los campos de la entidad Schedule)
    Long getId();  // o el nombre real del ID

    // Agrega los demás campos de Schedule que necesites (fecha, hora, etc.)

    // Campos específicos de producto
    String getBrand();
    String getModel();
    String getNombreProducto();
    String getPlacaProducto();

    // Campo del cliente
    String getNombreCliente();
}
