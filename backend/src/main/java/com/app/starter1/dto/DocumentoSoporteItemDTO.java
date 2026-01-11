package com.app.starter1.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoSoporteItemDTO {

    private Long id;
    private Integer numeroLinea;
    private Long productId;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 500)
    private String productName;

    @Size(max = 100)
    private String codigoProducto;

    private String descripcion;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(1)
    private Integer quantity;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin("0.0")
    private BigDecimal unitPrice;

    private BigDecimal subtotal;

    @Size(max = 50)
    private String unidadMedida;

    @Size(max = 10)
    private String unidadMedidaUNECE;

    @Size(max = 200)
    private String marca;

    @Size(max = 200)
    private String modelo;

    @Size(max = 20)
    private String tipoImpuesto;

    @Size(max = 20)
    private String tarifaIVA;

    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal porcentajeImpuesto;

    private BigDecimal baseImpuesto;
    private BigDecimal impuestoCalculado;
    private BigDecimal valorDescuentos;
    private BigDecimal valorCargos;
    private BigDecimal total;
}
