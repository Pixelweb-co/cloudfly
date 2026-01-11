package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDeductionDto {
    private String type; // HEALTH, PENSION, SOLIDARITY, TAX, etc.
    private BigDecimal amount;
}
