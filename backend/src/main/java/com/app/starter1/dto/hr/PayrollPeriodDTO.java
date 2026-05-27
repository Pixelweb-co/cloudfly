package com.app.starter1.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollPeriodDTO {
    private Long id;
    private String periodType;
    private Integer periodNumber;
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate paymentDate;
    private String status;
    private String description;
    private String periodName;
    private Integer workingDays;

    // Empleados asignados
    private List<Long> employeeIds;
    private Integer employeeCount;

    // Totales
    private BigDecimal totalPayroll;
    private BigDecimal elapsedPayroll; // Valor proporcional a días transcurridos
}
