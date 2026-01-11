package com.app.starter1.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaCreditoResponse {

    private Long id;
    private Long tenantId;
    private String numeroNotaCredito;
    private String prefijoDian;
    private Long consecutivoDian;
    private String cufe;

    private Long invoiceIdReferencia;
    private String cufeFacturaOriginal;
    private String numeroFacturaOriginal;
    private LocalDate fechaFacturaOriginal;

    private String motivo;
    private String codigoMotivoDian;

    private LocalDate fechaEmision;
    private java.time.LocalTime horaEmision;

    private List<NotaCreditoItemDTO> items;

    private BigDecimal subtotal;
    private BigDecimal totalDescuentos;
    private BigDecimal totalImpuestos;
    private BigDecimal total;

    private String estado;
    private String ambienteDian;
    private String mensajeDian;

    private Boolean contabilidadRevertida;
    private Long asientoReversionId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String approvedBy;
    private LocalDateTime approvedAt;
}
