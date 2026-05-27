package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoSoporteResponse {
    private Long id;
    private Long tenantId;
    private String numeroDocumento;
    private String prefijoDian;
    private Long consecutivoDian;
    private String cuds;
    private LocalDate fecha;
    private java.time.LocalTime horaEmision;

    private Long proveedorId;
    private String proveedorRazonSocial;
    private String proveedorNit;
    private String proveedorTipoDocumento;
    private String proveedorNumeroDocumento;
    private String proveedorDireccion;
    private String proveedorCiudad;
    private String proveedorDepartamento;
    private String proveedorEmail;

    private BigDecimal subtotal;
    private BigDecimal totalDescuentos;
    private BigDecimal totalImpuestos;
    private BigDecimal total;

    private String estado;
    private String ambienteDian;
    private String mensajeDian;
    private String observaciones;

    private Boolean accountingGenerated;
    private Long accountingVoucherId;
    private Boolean contabilidadGenerada;
    private Long asientoContableId;

    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

    private List<DocumentoSoporteItemDTO> items;
}
