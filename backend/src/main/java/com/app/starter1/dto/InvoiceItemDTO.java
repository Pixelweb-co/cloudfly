package com.app.starter1.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO para InvoiceItem con soporte DIAN
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItemDTO {

    private Long id;
    private Long invoiceId;

    // Campos originales
    @NotNull(message = "El ID del producto es obligatorio")
    private Long productId;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 500)
    private String productName;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer quantity;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio debe ser positivo")
    private BigDecimal unitPrice;

    private BigDecimal discount;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;

    // Campos DIAN
    @Size(max = 100)
    private String codigoProducto;

    @Size(max = 5000)
    private String descripcion;

    @Size(max = 10, message = "Código UNECE debe tener máximo 10 caracteres")
    private String unidadMedidaUNECE;

    @Size(max = 100)
    private String unidadMedidaDescripcion;

    @Size(max = 200)
    private String marca;

    @Size(max = 200)
    private String modelo;

    @Size(max = 20)
    private String tipoImpuesto;

    @Size(max = 20)
    private String tarifaIVA;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    private BigDecimal porcentajeImpuesto;

    private BigDecimal baseImpuesto;
    private BigDecimal impuestoCalculado;

    private String descuentosLinea;
    private BigDecimal valorDescuentos;

    private String cargosLinea;
    private BigDecimal valorCargos;

    private Integer numeroLinea;
    private Boolean esGratuito;

    @Size(max = 1000)
    private String notasLinea;
}
