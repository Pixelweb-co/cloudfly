package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollProvisionsDto {
    private BigDecimal health;
    private BigDecimal pension;
    private BigDecimal severance;
    private BigDecimal interestSeverance;
    private BigDecimal unemploymentFund;
    private BigDecimal vacation;
}
