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
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio para el cálculo de nómina (Lógica Colombia)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollCalculationService {

        private final PayrollConfigurationRepository configRepository;
        private final EmployeePayrollConceptRepository employeeConceptRepository;
        private final PayrollIncidenceRepository incidenceRepository;

        /**
         * Calcula la nómina de un empleado para un periodo específico
         */
        @Transactional
        public PayrollCalculationResult calculatePayroll(Employee employee, PayrollPeriod period) {
                log.info("Calculando nómina para empleado: {} en periodo: {}",
                                employee.getEmployeeNumber(), period.getPeriodName());

                // 1. Obtener configuración (valores por defecto 2025 si no existen)
                PayrollConfiguration config = configRepository.findByCustomer(employee.getCustomer())
                                .orElse(PayrollConfiguration.getDefault(employee.getCustomer()));

                // 2. Determinar días trabajados
                int periodDays = period.getWorkingDays();
                // TODO: Ajustar días según fecha de ingreso/retiro si ocurrió en este periodo

                // 3. Calcular salario diario y base
                BigDecimal dailySalary = calculateDailySalary(employee);
                BigDecimal baseSalary = dailySalary.multiply(BigDecimal.valueOf(periodDays));

                PayrollCalculationResult result = new PayrollCalculationResult();
                result.setEmployee(employee);
                result.setPeriod(period);
                result.setWorkingDays(periodDays);
                result.setDailySalary(dailySalary);
                result.setBaseSalary(baseSalary);

                // 4. Calcular Devengos
                calculateDevengos(result, employee, period, config, baseSalary);

                // 5. Calcular Deducciones (Salud, Pensión)
                calculateDeductions(result, config);

                // 6. Calcular Costos Empleador
                calculateEmployerCosts(result, employee, config, periodDays);

                // 7. Calcular Provisiones
                calculateProvisions(result, employee, config, periodDays);

                // 8. Calcular Netos finales
                result.calculateTotals();

                return result;
        }

        private void calculateDevengos(PayrollCalculationResult result, Employee employee,
                        PayrollPeriod period, PayrollConfiguration config, BigDecimal baseSalary) {

                List<Perception> perceptions = new ArrayList<>();
                BigDecimal totalEarningsWithoutTransport = BigDecimal.ZERO;

                // A. Salario Base (BASICO DIAN)
                perceptions.add(Perception.builder()
                                .code("SALARIO")
                                .dianCode(PayrollConcept.DIANCodes.BASICO)
                                .name("Sueldo Básico")
                                .amount(baseSalary)
                                .quantity(BigDecimal.valueOf(period.getWorkingDays()))
                                .isSalary(true)
                                .build());
                totalEarningsWithoutTransport = totalEarningsWithoutTransport.add(baseSalary);
                result.setSalaryAmount(baseSalary);

                // B. Incidencias (Horas Extras, Comisiones, Bonos)
                List<PayrollIncidence> incidences = incidenceRepository.findByPayrollPeriodAndEmployee(period,
                                employee);
                BigDecimal overtimeTotal = BigDecimal.ZERO;
                BigDecimal commissionsTotal = BigDecimal.ZERO;
                BigDecimal bonusesTotal = BigDecimal.ZERO;

                for (PayrollIncidence incidence : incidences) {
                        if (Boolean.TRUE.equals(incidence.getIsApproved())) {
                                BigDecimal amount = incidence.getAmount() != null ? incidence.getAmount()
                                                : BigDecimal.ZERO;
                                BigDecimal quantity = incidence.getDays() != null ? incidence.getDays()
                                                : BigDecimal.ZERO; // O Hours
                                String dianCode = PayrollConcept.DIANCodes.OTROS_CONCEPTOS;

                                // Si es un recargo de horas (ej: 2 horas extras) calcular monto basado en
                                // salario hora
                                if (isOvertimeType(incidence.getIncidenceType())) {
                                        if (amount.compareTo(BigDecimal.ZERO) == 0 && incidence.getDays() != null) {
                                                amount = calculateOvertimeAmount(result.getDailySalary(),
                                                                incidence.getIncidenceType(),
                                                                incidence.getDays(), config);
                                        }
                                        // Mapear Tipo a Código DIAN
                                        dianCode = mapIncidenceToDianCode(incidence.getIncidenceType());
                                        overtimeTotal = overtimeTotal.add(amount);
                                } else if (incidence.getIncidenceType() == PayrollIncidence.IncidenceType.COMISION) {
                                        dianCode = PayrollConcept.DIANCodes.COMISION;
                                        commissionsTotal = commissionsTotal.add(amount);
                                } else if (incidence.getIncidenceType() == PayrollIncidence.IncidenceType.BONO) {
                                        dianCode = PayrollConcept.DIANCodes.BONIFICACION;
                                        bonusesTotal = bonusesTotal.add(amount);
                                }

                                perceptions.add(Perception.builder()
                                                .code(incidence.getIncidenceType().name())
                                                .dianCode(dianCode)
                                                .name(incidence.getIncidenceType() != null
                                                                && incidence.getIncidenceType().getDescription() != null
                                                                                ? incidence.getIncidenceType()
                                                                                                .getDescription()
                                                                                : incidence.getIncidenceType().name())
                                                .amount(amount)
                                                .quantity(quantity)
                                                .isSalary(true) // Asumir salarial por defecto, ajustar según lógica
                                                .build());
                        }
                }

                result.setOvertimeAmount(overtimeTotal);
                result.setCommissionsAmount(commissionsTotal);
                result.setBonusesAmount(bonusesTotal);

                totalEarningsWithoutTransport = totalEarningsWithoutTransport
                                .add(overtimeTotal)
                                .add(commissionsTotal)
                                .add(bonusesTotal);

                // C. Conceptos Recurrentes (Adicionales)
                List<EmployeePayrollConcept> employeeConcepts = employeeConceptRepository
                                .findByEmployeeAndIsActiveTrue(employee);

                BigDecimal otherEarnings = BigDecimal.ZERO;

                for (EmployeePayrollConcept empConcept : employeeConcepts) {
                        PayrollConcept concept = empConcept.getPayrollConcept();
                        if (concept.getConceptType() == PayrollConcept.ConceptType.PERCEPCION &&
                                        isConceptValid(empConcept, period.getStartDate())) {

                                BigDecimal amount = calculateConceptAmount(empConcept, baseSalary);
                                perceptions.add(Perception.builder()
                                                .code(concept.getCode())
                                                .dianCode(concept.getDianCode() != null ? concept.getDianCode()
                                                                : PayrollConcept.DIANCodes.OTROS_CONCEPTOS)
                                                .name(concept.getName())
                                                .amount(amount)
                                                .isSalary(concept.getIsImssSubject()) // Usar flag IBC como proxy de
                                                                                      // Salarial
                                                .build());
                                otherEarnings = otherEarnings.add(amount);
                                totalEarningsWithoutTransport = totalEarningsWithoutTransport.add(amount);
                        }
                }
                result.setOtherEarnings(otherEarnings);

                // D. Auxilio de Transporte (TRANSPORTE DIAN)
                // Se paga si devenga hasta 2 SMMLV (Salario Base + HE habituales)
                BigDecimal auxTransporte = BigDecimal.ZERO;

                if (config.getMinimumWage() != null && config.getTransportAllowance() != null) {
                        BigDecimal umbralAuxilio = config.getMinimumWage().multiply(BigDecimal.valueOf(2));
                        BigDecimal baseParaAuxilio = baseSalary; // Simplificación: Usar sueldo básico mensual pactado

                        if (Boolean.TRUE.equals(employee.getHasTransportAllowance())
                                        && baseParaAuxilio.compareTo(umbralAuxilio) <= 0) {
                                // Auxilio proporcional a días trabajados
                                BigDecimal auxDiario = config.getTransportAllowance().divide(BigDecimal.valueOf(30), 2,
                                                RoundingMode.HALF_UP);
                                auxTransporte = auxDiario.multiply(BigDecimal.valueOf(period.getWorkingDays()));

                                perceptions.add(Perception.builder()
                                                .code("AUX_TRANS")
                                                .dianCode(PayrollConcept.DIANCodes.TRANSPORTE)
                                                .name("Auxilio de Transporte")
                                                .amount(auxTransporte)
                                                .quantity(BigDecimal.valueOf(period.getWorkingDays()))
                                                .isSalary(false)
                                                .build());
                        }
                }
                result.setTransportAllowanceAmount(auxTransporte);
                result.setPerceptions(perceptions);

                // Base para seguridad social = Total Devengado - Aux. Transporte - Otros no
                // salariales
                // En Colombia HE y Comisiones hacen parte de base de cotización
                result.setBaseSecuritySocial(totalEarningsWithoutTransport);

                // Base para prestaciones (Incluye Aux Transporte)
                result.setBasePrestaciones(totalEarningsWithoutTransport.add(auxTransporte));
        }

        private void calculateDeductions(PayrollCalculationResult result, PayrollConfiguration config) {
                List<Deduction> deductions = new ArrayList<>();
                BigDecimal ibc = result.getBaseSecuritySocial(); // Ingreso Base de Cotización

                // Valores por defecto si no están configurados
                BigDecimal healthPct = config.getHealthPercentageEmployee() != null
                                ? config.getHealthPercentageEmployee()
                                : new BigDecimal("4.00");
                BigDecimal pensionPct = config.getPensionPercentageEmployee() != null
                                ? config.getPensionPercentageEmployee()
                                : new BigDecimal("4.00");
                BigDecimal solidarityPct = config.getSolidarityFundPercentage() != null
                                ? config.getSolidarityFundPercentage()
                                : new BigDecimal("1.00");

                // 1. Salud (4%) (SALUD DIAN)
                BigDecimal healthVal = ibc.multiply(healthPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP); // Redondeo al peso

                deductions.add(Deduction.builder()
                                .code("SALUD_EMP")
                                .dianCode(PayrollConcept.DIANCodes.SALUD)
                                .name("Aporte Salud (" + healthPct + "%)")
                                .amount(healthVal)
                                .percentage(healthPct)
                                .build());
                result.setHealthDeduction(healthVal);

                // 2. Pensión (4%) (PENSION DIAN)
                BigDecimal pensionVal = ibc.multiply(pensionPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                deductions.add(Deduction.builder()
                                .code("PENSION_EMP")
                                .dianCode(PayrollConcept.DIANCodes.PENSION)
                                .name("Aporte Pensión (" + pensionPct + "%)")
                                .amount(pensionVal)
                                .percentage(pensionPct)
                                .build());
                result.setPensionDeduction(pensionVal);

                // 3. Fondo Solidaridad Pensional (> 4 SMMLV) (FONDO_SP DIAN)
                if (config.getMinimumWage() != null) {
                        BigDecimal smmlv4 = config.getMinimumWage().multiply(BigDecimal.valueOf(4));
                        if (ibc.compareTo(smmlv4) >= 0) {
                                BigDecimal fspVal = ibc.multiply(solidarityPct)
                                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                                deductions.add(Deduction.builder()
                                                .code("FSP")
                                                .dianCode(PayrollConcept.DIANCodes.FONDO_SP)
                                                .name("Fondo Solidaridad Pensional")
                                                .amount(fspVal)
                                                .percentage(solidarityPct)
                                                .build());
                                result.setOtherDeductions(result.getOtherDeductions().add(fspVal));
                        }
                }

                // 4. Otras Deducciones (Préstamos, Libranzas)
                // TODO: Implementar lógica de préstamos desde incidencias negativas
                // Por ahora no hay código para esto en Incidencias, se deja placeholder

                result.setDeductions(deductions);
        }

        private void calculateEmployerCosts(PayrollCalculationResult result, Employee employee,
                        PayrollConfiguration config, int days) {
                BigDecimal ibc = result.getBaseSecuritySocial();

                // Valores por defecto si no están configurados
                BigDecimal healthEmployerPct = config.getHealthPercentageEmployer() != null
                                ? config.getHealthPercentageEmployer()
                                : new BigDecimal("8.50");
                BigDecimal pensionEmployerPct = config.getPensionPercentageEmployer() != null
                                ? config.getPensionPercentageEmployer()
                                : new BigDecimal("12.00");
                BigDecimal arlPct = config.getArlPercentage() != null ? config.getArlPercentage()
                                : new BigDecimal("0.522");
                BigDecimal cajaPct = config.getParafiscalCajaPercentage() != null ? config.getParafiscalCajaPercentage()
                                : new BigDecimal("4.00");
                BigDecimal senaPct = config.getParafiscalSenaPercentage() != null ? config.getParafiscalSenaPercentage()
                                : new BigDecimal("2.00");
                BigDecimal icbfPct = config.getParafiscalIcbfPercentage() != null ? config.getParafiscalIcbfPercentage()
                                : new BigDecimal("3.00");

                // Salud Empleador (8.5%) - Exonerado si < 10 SMMLV (Ley 1607) - Asumimos no
                // exonerado por ahora
                BigDecimal healthEmployer = ibc.multiply(healthEmployerPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                // Pensión Empleador (12%)
                BigDecimal pensionEmployer = ibc.multiply(pensionEmployerPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                // ARL (Según riesgo) - Riesgo I por defecto
                BigDecimal arlVal = ibc.multiply(arlPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                // Parafiscales (SENA, ICBF, Caja)
                BigDecimal cajaVal = ibc.multiply(cajaPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                BigDecimal senaVal = ibc.multiply(senaPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                BigDecimal icbfVal = ibc.multiply(icbfPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                result.setEmployerHealthContribution(healthEmployer);
                result.setEmployerPensionContribution(pensionEmployer);
                result.setArlContribution(arlVal);
                result.setCajaCompensacionContribution(cajaVal);
                result.setSenaContribution(senaVal);
                result.setIcbfContribution(icbfVal);
        }

        private void calculateProvisions(PayrollCalculationResult result, Employee employee,
                        PayrollConfiguration config, int days) {
                // Base para prestaciones incluye auxilio de transporte
                BigDecimal basePrestaciones = result.getBasePrestaciones();

                // Valores por defecto si no están configurados
                BigDecimal primaPct = config.getPrimaPercentage() != null ? config.getPrimaPercentage()
                                : new BigDecimal("8.33");
                BigDecimal cesantiasPct = config.getCesantiasPercentage() != null ? config.getCesantiasPercentage()
                                : new BigDecimal("8.33");
                BigDecimal vacacionesPct = config.getVacacionesPercentage() != null ? config.getVacacionesPercentage()
                                : new BigDecimal("4.17");

                // Prima de Servicios (8.33%)
                BigDecimal prima = basePrestaciones.multiply(primaPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                // Cesantías (8.33%)
                BigDecimal cesantias = basePrestaciones.multiply(cesantiasPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                // Intereses sobre Cesantías (1% mensual sobre cesantías acumuladas -> 12%
                // anual)
                // Simplificación contable: 1% de la base prestacional mensual
                BigDecimal intCesantias = cesantias.multiply(BigDecimal.valueOf(0.12)); // 1% mensual

                // Vacaciones (4.17%) - NO incluye auxilio de transporte
                BigDecimal baseVacaciones = result.getBaseSecuritySocial();
                BigDecimal vacaciones = baseVacaciones.multiply(vacacionesPct)
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

                result.setPrimaServiciosProvision(prima);
                result.setCesantiasProvision(cesantias);
                result.setInteresesCesantiasProvision(intCesantias);
                result.setVacacionesProvision(vacaciones);
        }

        private BigDecimal calculateDailySalary(Employee employee) {
                BigDecimal monthlySalary = employee.getBaseSalary();
                // En Colombia se usa divisor 30 para todos los efectos laborales
                return monthlySalary.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        }

        private boolean isOvertimeType(PayrollIncidence.IncidenceType type) {
                return type == PayrollIncidence.IncidenceType.HORAS_EXTRA ||
                                type == PayrollIncidence.IncidenceType.HORAS_EXTRA_NOCTURNA ||
                                type == PayrollIncidence.IncidenceType.RECARGO_NOCTURNO ||
                                type == PayrollIncidence.IncidenceType.DOMINICAL_FESTIVO;
        }

        private BigDecimal calculateOvertimeAmount(BigDecimal dailySalary, PayrollIncidence.IncidenceType type,
                        BigDecimal hours, PayrollConfiguration config) {
                BigDecimal hourlyRate = dailySalary.divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP);
                BigDecimal factor = BigDecimal.ONE;

                if (type == PayrollIncidence.IncidenceType.HORAS_EXTRA) {
                        factor = config.getOvertimeDayFactor() != null ? config.getOvertimeDayFactor()
                                        : new BigDecimal("1.2500");
                } else if (type == PayrollIncidence.IncidenceType.HORAS_EXTRA_NOCTURNA) {
                        factor = config.getOvertimeNightFactor() != null ? config.getOvertimeNightFactor()
                                        : new BigDecimal("1.7500");
                } else if (type == PayrollIncidence.IncidenceType.RECARGO_NOCTURNO) {
                        factor = config.getNightSurchargeFactor() != null ? config.getNightSurchargeFactor()
                                        : new BigDecimal("0.3500");
                } else if (type == PayrollIncidence.IncidenceType.DOMINICAL_FESTIVO) {
                        factor = config.getSundayHolidayFactor() != null ? config.getSundayHolidayFactor()
                                        : new BigDecimal("1.7500");
                }
                return hourlyRate.multiply(hours).multiply(factor);
        }

        private BigDecimal calculateConceptAmount(EmployeePayrollConcept empConcept, BigDecimal basePay) {
                if (empConcept.getAmountValue() == null) {
                        return BigDecimal.ZERO;
                }
                if (empConcept.getAmountType() == EmployeePayrollConcept.AmountType.FIXED_AMOUNT) {
                        return empConcept.getAmountValue();
                } else {
                        return basePay.multiply(empConcept.getAmountValue())
                                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
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

        @lombok.Data
        public static class PayrollCalculationResult {
                private Employee employee;
                private PayrollPeriod period;
                private int workingDays;
                private BigDecimal dailySalary = BigDecimal.ZERO;
                private BigDecimal baseSalary = BigDecimal.ZERO;

                // Devengos
                private BigDecimal salaryAmount = BigDecimal.ZERO;
                private BigDecimal overtimeAmount = BigDecimal.ZERO;
                private BigDecimal commissionsAmount = BigDecimal.ZERO;
                private BigDecimal transportAllowanceAmount = BigDecimal.ZERO;
                private BigDecimal bonusesAmount = BigDecimal.ZERO;
                private BigDecimal otherEarnings = BigDecimal.ZERO;

                // Bases
                private BigDecimal baseSecuritySocial = BigDecimal.ZERO; // IBC
                private BigDecimal basePrestaciones = BigDecimal.ZERO;

                // Deducciones
                private BigDecimal healthDeduction = BigDecimal.ZERO;
                private BigDecimal pensionDeduction = BigDecimal.ZERO;
                private BigDecimal otherDeductions = BigDecimal.ZERO;

                // Costos Empleador
                private BigDecimal employerHealthContribution = BigDecimal.ZERO;
                private BigDecimal employerPensionContribution = BigDecimal.ZERO;
                private BigDecimal arlContribution = BigDecimal.ZERO;
                private BigDecimal senaContribution = BigDecimal.ZERO;
                private BigDecimal icbfContribution = BigDecimal.ZERO;
                private BigDecimal cajaCompensacionContribution = BigDecimal.ZERO;

                // Provisiones
                private BigDecimal primaServiciosProvision = BigDecimal.ZERO;
                private BigDecimal cesantiasProvision = BigDecimal.ZERO;
                private BigDecimal interesesCesantiasProvision = BigDecimal.ZERO;
                private BigDecimal vacacionesProvision = BigDecimal.ZERO;

                // Listas detalle
                private List<Perception> perceptions = new ArrayList<>();
                private List<Deduction> deductions = new ArrayList<>();

                // Totales finales
                private BigDecimal totalPerceptions = BigDecimal.ZERO;
                private BigDecimal totalDeductions = BigDecimal.ZERO;
                private BigDecimal netPay = BigDecimal.ZERO;
                private BigDecimal totalEmployerCosts = BigDecimal.ZERO;
                private BigDecimal totalProvisions = BigDecimal.ZERO;

                public void calculateTotals() {
                        this.totalPerceptions = perceptions.stream()
                                        .map(Perception::getAmount)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        this.totalDeductions = deductions.stream()
                                        .map(Deduction::getAmount)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        this.netPay = totalPerceptions.subtract(totalDeductions);

                        this.totalEmployerCosts = employerHealthContribution
                                        .add(employerPensionContribution)
                                        .add(arlContribution)
                                        .add(senaContribution)
                                        .add(icbfContribution)
                                        .add(cajaCompensacionContribution);

                        this.totalProvisions = primaServiciosProvision
                                        .add(cesantiasProvision)
                                        .add(interesesCesantiasProvision)
                                        .add(vacacionesProvision);
                }
        }

        @lombok.Data
        @lombok.AllArgsConstructor
        @lombok.Builder
        public static class Perception {
                private String code;
                private String dianCode; // Código DIAN
                private String name;
                private BigDecimal amount;
                private BigDecimal quantity;
                private BigDecimal percentage;
                private Boolean isSalary; // Salarial o No Salarial
        }

        @lombok.Data
        @lombok.AllArgsConstructor
        @lombok.Builder
        public static class Deduction {
                private String code;
                private String dianCode;
                private String name;
                private BigDecimal amount;
                private BigDecimal percentage;
        }

        /**
         * Mapea tipo de incidencia a código DIAN
         */
        private String mapIncidenceToDianCode(PayrollIncidence.IncidenceType type) {
                return switch (type) {
                        case HORAS_EXTRA -> PayrollConcept.DIANCodes.HED;
                        case HORAS_EXTRA_NOCTURNA -> PayrollConcept.DIANCodes.HEN;
                        case RECARGO_NOCTURNO -> PayrollConcept.DIANCodes.HRN;
                        case DOMINICAL_FESTIVO -> PayrollConcept.DIANCodes.HRDDF;
                        case HORAS_EXTRA_DOMINICAL -> PayrollConcept.DIANCodes.HEDDF;
                        case HORAS_EXTRA_DOMINICAL_NOCTURNA -> PayrollConcept.DIANCodes.HENDF;
                        case RECARGO_DOMINICAL_NOCTURNO -> PayrollConcept.DIANCodes.HRNDF;
                        case COMISION -> PayrollConcept.DIANCodes.COMISION;
                        case BONO -> PayrollConcept.DIANCodes.BONIFICACION;
                        default -> PayrollConcept.DIANCodes.OTROS_CONCEPTOS;
                };
        }
}
