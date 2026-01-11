package co.cloudfly.dian.common.payload;

import co.cloudfly.dian.common.dto.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Payload para nómina electrónica
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicPayrollPayload {

    // Identificación
    private String payrollReceiptId;
    private Long payrollPeriodId;
    private String payrollSequence;

    // Fechas
    private LocalDate generationDate;
    private LocalDate issueDate;

    // Periodo de liquidación
    private PayrollPeriodDto period;

    // Partes
    private PartyDto employer; // Empleador
    private EmployeePayrollDto employee; // Empleado

    // Devengados
    private List<PayrollEarningDto> earnings;

    // Deducciones
    private List<PayrollDeductionDto> deductions;

    // Provisiones (aportes empleador)
    private PayrollProvisionsDto provisions;

    // Totales
    private PayrollTotalsDto totals;

    // Observaciones
    private String notes;

    // Tipo de nómina
    private String payrollType; // 102=Nómina Individual, 103=Nómina Individual Ajuste
}
