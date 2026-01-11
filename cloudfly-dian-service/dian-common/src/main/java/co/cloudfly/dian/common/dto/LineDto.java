package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Línea de item en factura/nota
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineDto {

    private Integer lineNumber;

    // Producto/Servicio
    private String itemCode;
    private String description;
    private String brandName;
    private String modelName;

    // Cantidad y unidad
    private BigDecimal quantity;
    private String unitCode; // 94=Unidad, KGM=Kilogramo, etc.

    // Precios
    private BigDecimal unitPrice;
    private BigDecimal lineExtensionAmount; // quantity * unitPrice

    // Impuestos
    private TaxDto[] taxes;

    // Descuentos/Cargos a nivel de línea
    private AllowanceChargeDto[] allowancesCharges;

    // Total de la línea (con impuestos)
    private BigDecimal totalAmount;
}
