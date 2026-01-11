package com.app.starter1.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaCreditoRequest {

    @NotNull(message = "El ID de la factura de referencia es obligatorio")
    private Long invoiceIdReferencia;

    private String cufeFacturaOriginal;
    private String numeroFacturaOriginal;
    private LocalDate fechaFacturaOriginal;

    @NotBlank(message = "El motivo es obligatorio")
    @Size(max = 5000)
    private String motivo;

    @Size(max = 2)
    private String codigoMotivoDian; // 1-5

    @NotNull(message = "La fecha de emisión es obligatoria")
    private LocalDate fechaEmision;

    @NotNull(message = "Debe incluir al menos un item")
    @Size(min = 1)
    private List<NotaCreditoItemDTO> items;

    private String ambienteDian;
}
