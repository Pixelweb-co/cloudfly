package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxDto {
    private String taxScheme; // 01=IVA, 02=IC, 03=ICA
    private BigDecimal taxableAmount; // Base gravable
    private BigDecimal taxPercent; // Porcentaje
    private BigDecimal taxAmount; // Valor del impuesto
}
