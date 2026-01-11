package com.app.starter1.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class DocumentoSoporteRequest {

    @NotNull
    private LocalDate fecha;

    @NotNull
    private Long proveedorId;

    private String observaciones;

    @NotNull
    private List<ItemRequest> items;

    @Data
    public static class ItemRequest {
        private String productName;
        private String descripcion; // DIAN description
        private Integer quantity;
        private BigDecimal unitPrice;
        private String unidadMedida; // UNECE
        private BigDecimal porcentajeImpuesto;
    }
}
