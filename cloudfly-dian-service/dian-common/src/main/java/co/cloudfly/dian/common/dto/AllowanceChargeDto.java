package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllowanceChargeDto {
    private Boolean chargeIndicator; // true=Cargo, false=Descuento
    private String reason;
    private BigDecimal amount;
    private BigDecimal percent;
    private BigDecimal baseAmount;
}
