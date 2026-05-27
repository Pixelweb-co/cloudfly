package co.cloudfly.dian.common.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollPeriodDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer workedDays;
    private String periodicity; // MENSUAL, QUINCENAL, etc.
}
