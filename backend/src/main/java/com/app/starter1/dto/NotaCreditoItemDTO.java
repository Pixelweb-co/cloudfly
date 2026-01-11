package com.app.starter1.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaCreditoItemDTO {

    private Long id;
    private Integer numeroLinea;

    @NotNull
    private Long productId;

    @NotBlank
    private String productName;

    private String codigoProducto;
    private String descripcion;

    @NotNull
    @Min(1)
    private Integer quantity;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal unitPrice;

    private BigDecimal subtotal;
    private String unidadMedidaUNECE;
    private String tipoImpuesto;
    private BigDecimal porcentajeImpuesto;
    private BigDecimal baseImpuesto;
    private BigDecimal impuestoCalculado;
    private BigDecimal valorDescuentos;
    private BigDecimal total;
}
