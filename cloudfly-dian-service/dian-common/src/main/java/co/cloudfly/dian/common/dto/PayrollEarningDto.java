package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollEarningDto {
    private String type; // BASIC_SALARY, OVERTIME, BONUS, etc.
    private BigDecimal amount;
}
