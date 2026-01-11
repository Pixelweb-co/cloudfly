package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollTotalsDto {
    private BigDecimal totalEarnings;
    private BigDecimal totalDeductions;
    private BigDecimal netPayment;
    private BigDecimal totalProvisions;
}
