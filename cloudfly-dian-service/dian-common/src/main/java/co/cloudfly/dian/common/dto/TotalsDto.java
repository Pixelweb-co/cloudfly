package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Totales de factura/nota
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TotalsDto {

    // Subtotales
    private BigDecimal lineExtensionAmount; // Suma de líneas sin impuestos
    private BigDecimal taxExclusiveAmount; // Base gravable
    private BigDecimal taxInclusiveAmount; // Total con impuestos

    // Impuestos totales
    private BigDecimal totalTaxAmount;
    private BigDecimal totalIvaAmount;
    private BigDecimal totalIcAmount;

    // Descuentos/Cargos globales
    private BigDecimal totalAllowances;
    private BigDecimal totalCharges;

    // Total a pagar
    private BigDecimal payableAmount;

    // Anticipos
    private BigDecimal prepaidAmount;
}
