package com.app.starter1.services;

import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Servicio para el cálculo de nómina
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollCalculationService {

    private final EmployeeRepository employeeRepository;
    private final PayrollConceptRepository conceptRepository;
    private final EmployeePayrollConceptRepository employeeConceptRepository;
    private final PayrollIncidenceRepository incidenceRepository;
    private final PayrollConfigurationRepository configRepository;
    private final CustomerRepository customerRepository;

    /**
     * Calcula la nómina de un empleado para un periodo específico
     */
    @Transactional
    public PayrollCalculationResult calculatePayroll(Employee employee, PayrollPeriod period) {
        log.info("Calculating payroll for employee: {} in period: {}",
                employee.getEmployeeNumber(), period.getPeriodName());

        PayrollCalculationResult result = new PayrollCalculationResult();
        result.setEmployee(employee);
        result.setPeriod(period);

        // 1. Calcular días trabajados
        int workingDays = period.getWorkingDays();
        BigDecimal dailySalary = calculateDailySalary(employee);
        result.setWorkingDays(workingDays);
        result.setDailySalary(dailySalary);

        // 2. Obtener configuración
        PayrollConfiguration config = configRepository.findByCustomer(employee.getCustomer())
                .orElse(PayrollConfiguration.getDefault(employee.getCustomer()));

        // 3. Calcular sueldo base
        BigDecimal basePay = dailySalary.multiply(BigDecimal.valueOf(workingDays));
        result.setBasePay(basePay);

        // 4. Aplicar percepciones recurrentes
        BigDecimal totalPerceptions = basePay;
        List<Perception> perceptions = result.getPerceptions();
        perceptions.add(new Perception("001", "Sueldo Base", basePay));

        // Obtener conceptos recurrentes del empleado
        List<EmployeePayrollConcept> employeeConcepts = employeeConceptRepository
                .findByEmployeeAndIsActiveTrue(employee);

        for (EmployeePayrollConcept empConcept : employeeConcepts) {
            if (empConcept.getPayrollConcept().getConceptType() == PayrollConcept.ConceptType.PERCEPCION) {
                if (isConceptValid(empConcept, period.getStartDate())) {
                    BigDecimal amount = calculateConceptAmount(empConcept, basePay);
                    perceptions.add(new Perception(
                            empConcept.getPayrollConcept().getCode(),
                            empConcept.getPayrollConcept().getName(),
                            amount));
                    totalPerceptions = totalPerceptions.add(amount);
                }
            }
        }

        // 5. Aplicar incidencias
        List<PayrollIncidence> incidences = incidenceRepository.findByPayrollPeriodAndEmployee(period, employee);
        for (PayrollIncidence incidence : incidences) {
            if (incidence.getIsApproved()) {
                BigDecimal amount = incidence.getAmount() != null ? incidence.getAmount() : BigDecimal.ZERO;

                PayrollIncidence.IncidenceType type = incidence.getIncidenceType();
                if (type == PayrollIncidence.IncidenceType.HORAS_EXTRA ||
                        type == PayrollIncidence.IncidenceType.BONO ||
                        type == PayrollIncidence.IncidenceType.COMISION) {
                    perceptions.add(new Perception(
                            "INC-" + incidence.getId(),
                            type.getDescription(),
                            amount));
                    totalPerceptions = totalPerceptions.add(amount);
                } else if (type == PayrollIncidence.IncidenceType.FALTA ||
                        type == PayrollIncidence.IncidenceType.PERMISO_SIN_GOCE) {
                    BigDecimal discount = dailySalary.multiply(incidence.getDays());
                    result.getDeductions().add(new Deduction(
                            "INC-" + incidence.getId(),
                            "Descuento por " + type.getDescription(),
                            discount));
                }
            }
        }

        result.setTotalPerceptions(totalPerceptions);

        // 6. Calcular deducciones
        BigDecimal totalDeductions = BigDecimal.ZERO;
        List<Deduction> deductions = result.getDeductions();

        // Calcular ISR si está configurado
        if (config.getApplyIsr()) {
            BigDecimal isr = calculateISR(totalPerceptions, period.getPeriodType());
            if (isr.compareTo(BigDecimal.ZERO) > 0) {
                deductions.add(new Deduction("ISR", "ISR", isr));
                totalDeductions = totalDeductions.add(isr);
            }
        }

        // Calcular IMSS si está configurado
        if (config.getApplyImss()) {
            BigDecimal imss = calculateIMSS(employee.getBaseSalary(), config);
            if (imss.compareTo(BigDecimal.ZERO) > 0) {
                deductions.add(new Deduction("IMSS", "IMSS", imss));
                totalDeductions = totalDeductions.add(imss);
            }
        }

        // Aplicar deducciones recurrentes
        for (EmployeePayrollConcept empConcept : employeeConcepts) {
            if (empConcept.getPayrollConcept().getConceptType() == PayrollConcept.ConceptType.DEDUCCION) {
                if (isConceptValid(empConcept, period.getStartDate())) {
                    BigDecimal amount = calculateConceptAmount(empConcept, basePay);
                    deductions.add(new Deduction(
                            empConcept.getPayrollConcept().getCode(),
                            empConcept.getPayrollConcept().getName(),
                            amount));
                    totalDeductions = totalDeductions.add(amount);
                }
            }
        }

        result.setTotalDeductions(totalDeductions);

        // 7. Calcular neto
        BigDecimal netPay = totalPerceptions.subtract(totalDeductions);
        result.setNetPay(netPay);

        log.info("Payroll calculated - Perceptions: {}, Deductions: {}, Net: {}",
                totalPerceptions, totalDeductions, netPay);

        return result;
    }

    private BigDecimal calculateDailySalary(Employee employee) {
        BigDecimal monthlySalary = employee.getBaseSalary();

        Employee.PaymentFrequency freq = employee.getPaymentFrequency();
        if (freq == Employee.PaymentFrequency.WEEKLY) {
            return monthlySalary.divide(BigDecimal.valueOf(7), 2, RoundingMode.HALF_UP);
        } else if (freq == Employee.PaymentFrequency.BIWEEKLY) {
            return monthlySalary.divide(BigDecimal.valueOf(15), 2, RoundingMode.HALF_UP);
        } else {
            return monthlySalary.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        }
    }

    private boolean isConceptValid(EmployeePayrollConcept concept, LocalDate date) {
        if (concept.getStartDate() != null && date.isBefore(concept.getStartDate())) {
            return false;
        }
        if (concept.getEndDate() != null && date.isAfter(concept.getEndDate())) {
            return false;
        }
        return true;
    }

    private BigDecimal calculateConceptAmount(EmployeePayrollConcept empConcept, BigDecimal basePay) {
        if (empConcept.getAmountType() == EmployeePayrollConcept.AmountType.FIXED_AMOUNT) {
            return empConcept.getAmountValue();
        } else {
            return basePay.multiply(empConcept.getAmountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
    }

    private BigDecimal calculateISR(BigDecimal income, PayrollPeriod.PeriodType periodType) {
        if (income.compareTo(BigDecimal.valueOf(10000)) > 0) {
            return income.multiply(BigDecimal.valueOf(0.10))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateIMSS(BigDecimal salary, PayrollConfiguration config) {
        return salary.multiply(BigDecimal.valueOf(0.025))
                .setScale(2, RoundingMode.HALF_UP);
    }

    @lombok.Data
    public static class PayrollCalculationResult {
        private Employee employee;
        private PayrollPeriod period;
        private int workingDays;
        private BigDecimal dailySalary;
        private BigDecimal basePay;
        private List<Perception> perceptions = new java.util.ArrayList<>();
        private List<Deduction> deductions = new java.util.ArrayList<>();
        private BigDecimal totalPerceptions;
        private BigDecimal totalDeductions;
        private BigDecimal netPay;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class Perception {
        private String code;
        private String name;
        private BigDecimal amount;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class Deduction {
        private String code;
        private String name;
        private BigDecimal amount;
    }
}
