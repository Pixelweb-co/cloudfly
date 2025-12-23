package com.app.starter1.services;

import com.app.starter1.dto.hr.PayrollCostByCostCenterDTO;
import com.app.starter1.dto.hr.PayrollCostByCostCenterDTO.CostCenterCostDTO;
import com.app.starter1.dto.hr.PayrollCostByCostCenterDTO.SummaryDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para generar reportes de nómina por centro de costo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollCostCenterReportService {

    private final PayrollReceiptRepository payrollReceiptRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final CostCenterRepository costCenterRepository;
    private final CustomerRepository customerRepository;

    /**
     * Genera el reporte de costos de nómina por centro de costo para un período
     * específico
     */
    @Transactional(readOnly = true)
    public PayrollCostByCostCenterDTO getPayrollCostsByCostCenter(Long periodId, Long customerId) {
        log.info("Generating payroll cost report by cost center for period {} and customer {}", periodId, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        PayrollPeriod period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        // Verificar que el período pertenece al cliente
        if (!period.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Period does not belong to customer");
        }

        // Obtener todos los recibos del período
        List<PayrollReceipt> receipts = payrollReceiptRepository.findByPayrollPeriod(period);

        // Agrupar por centro de costo
        Map<Long, List<PayrollReceipt>> receiptsByCostCenter = receipts.stream()
                .collect(Collectors.groupingBy(r -> r.getEmployee().getCostCenter() != null
                        ? r.getEmployee().getCostCenter().getId()
                        : 0L // ID 0 para empleados sin centro de costo
                ));

        // Construir DTOs por centro de costo
        List<CostCenterCostDTO> costCenterCosts = new ArrayList<>();
        BigDecimal grandTotalEmployerCost = BigDecimal.ZERO;

        for (Map.Entry<Long, List<PayrollReceipt>> entry : receiptsByCostCenter.entrySet()) {
            CostCenterCostDTO ccCost = buildCostCenterCost(entry.getKey(), entry.getValue());
            costCenterCosts.add(ccCost);
            grandTotalEmployerCost = grandTotalEmployerCost.add(ccCost.getTotalEmployerCost());
        }

        // Calcular porcentajes
        for (CostCenterCostDTO ccCost : costCenterCosts) {
            if (grandTotalEmployerCost.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal percentage = ccCost.getTotalEmployerCost()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(grandTotalEmployerCost, 2, RoundingMode.HALF_UP);
                ccCost.setPercentageOfTotal(percentage);
            } else {
                ccCost.setPercentageOfTotal(BigDecimal.ZERO);
            }
        }

        // Ordenar por costo total descendente
        costCenterCosts.sort((a, b) -> b.getTotalEmployerCost().compareTo(a.getTotalEmployerCost()));

        // Construir el resumen
        SummaryDTO summary = buildSummary(receipts, costCenterCosts.size());

        return PayrollCostByCostCenterDTO.builder()
                .periodId(period.getId())
                .periodYear(period.getYear())
                .periodNumber(period.getPeriodNumber())
                .periodType(period.getPeriodType().name())
                .periodName(period.getPeriodName())
                .costCenters(costCenterCosts)
                .summary(summary)
                .build();
    }

    /**
     * Genera reporte consolidado de múltiples períodos (para análisis de
     * tendencias)
     */
    @Transactional(readOnly = true)
    public List<PayrollCostByCostCenterDTO> getPayrollCostsByCostCenterForYear(Integer year, Long customerId) {
        log.info("Generating yearly payroll cost report by cost center for year {} and customer {}", year, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        List<PayrollPeriod> periods = payrollPeriodRepository.findByCustomerAndYearOrderByPeriodNumberDesc(customer,
                year);

        return periods.stream()
                .filter(p -> p.getStatus() != PayrollPeriod.PeriodStatus.OPEN)
                .map(p -> getPayrollCostsByCostCenter(p.getId(), customerId))
                .collect(Collectors.toList());
    }

    private CostCenterCostDTO buildCostCenterCost(Long costCenterId, List<PayrollReceipt> receipts) {
        CostCenter costCenter = null;
        if (costCenterId != null && costCenterId > 0) {
            costCenter = costCenterRepository.findById(costCenterId).orElse(null);
        }

        BigDecimal totalSalary = BigDecimal.ZERO;
        BigDecimal totalOvertime = BigDecimal.ZERO;
        BigDecimal totalTransport = BigDecimal.ZERO;
        BigDecimal totalPerceptions = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNetPay = BigDecimal.ZERO;
        BigDecimal totalEmployerHealth = BigDecimal.ZERO;
        BigDecimal totalEmployerPension = BigDecimal.ZERO;
        BigDecimal totalArl = BigDecimal.ZERO;
        BigDecimal totalCaja = BigDecimal.ZERO;
        BigDecimal totalIcbf = BigDecimal.ZERO;
        BigDecimal totalSena = BigDecimal.ZERO;
        BigDecimal totalCesantias = BigDecimal.ZERO;
        BigDecimal totalPrima = BigDecimal.ZERO;
        BigDecimal totalVacaciones = BigDecimal.ZERO;

        Set<Long> uniqueEmployees = new HashSet<>();

        for (PayrollReceipt r : receipts) {
            uniqueEmployees.add(r.getEmployee().getId());

            totalSalary = totalSalary.add(nullToZero(r.getSalaryAmount()));
            totalOvertime = totalOvertime.add(nullToZero(r.getOvertimeAmount()));
            totalTransport = totalTransport.add(nullToZero(r.getTransportAllowanceAmount()));
            totalPerceptions = totalPerceptions.add(nullToZero(r.getTotalPerceptions()));
            totalDeductions = totalDeductions.add(nullToZero(r.getTotalDeductions()));
            totalNetPay = totalNetPay.add(nullToZero(r.getNetPay()));
            totalEmployerHealth = totalEmployerHealth.add(nullToZero(r.getEmployerHealthContribution()));
            totalEmployerPension = totalEmployerPension.add(nullToZero(r.getEmployerPensionContribution()));
            totalArl = totalArl.add(nullToZero(r.getArlContribution()));
            totalCaja = totalCaja.add(nullToZero(r.getCajaCompensacionContribution()));
            totalIcbf = totalIcbf.add(nullToZero(r.getIcbfContribution()));
            totalSena = totalSena.add(nullToZero(r.getSenaContribution()));
            totalCesantias = totalCesantias.add(nullToZero(r.getCesantiasProvision()));
            totalPrima = totalPrima.add(nullToZero(r.getPrimaServiciosProvision()));
            totalVacaciones = totalVacaciones.add(nullToZero(r.getVacacionesProvision()));
        }

        // Costo total empleador = Devengos + Aportes patronales + Provisiones
        BigDecimal totalEmployerCost = totalPerceptions
                .add(totalEmployerHealth)
                .add(totalEmployerPension)
                .add(totalArl)
                .add(totalCaja)
                .add(totalIcbf)
                .add(totalSena)
                .add(totalCesantias)
                .add(totalPrima)
                .add(totalVacaciones);

        return CostCenterCostDTO.builder()
                .costCenterId(costCenter != null ? costCenter.getId() : null)
                .costCenterCode(costCenter != null ? costCenter.getCode() : "SIN-CC")
                .costCenterName(costCenter != null ? costCenter.getName() : "Sin Centro de Costo")
                .employeeCount(uniqueEmployees.size())
                .totalSalary(totalSalary)
                .totalOvertime(totalOvertime)
                .totalTransport(totalTransport)
                .totalPerceptions(totalPerceptions)
                .totalDeductions(totalDeductions)
                .totalNetPay(totalNetPay)
                .totalEmployerHealth(totalEmployerHealth)
                .totalEmployerPension(totalEmployerPension)
                .totalArl(totalArl)
                .totalCaja(totalCaja)
                .totalIcbf(totalIcbf)
                .totalSena(totalSena)
                .totalCesantias(totalCesantias)
                .totalPrima(totalPrima)
                .totalVacaciones(totalVacaciones)
                .totalEmployerCost(totalEmployerCost)
                .percentageOfTotal(BigDecimal.ZERO) // Se calcula después
                .build();
    }

    private SummaryDTO buildSummary(List<PayrollReceipt> receipts, int costCenterCount) {
        BigDecimal grandTotalSalary = BigDecimal.ZERO;
        BigDecimal grandTotalOvertime = BigDecimal.ZERO;
        BigDecimal grandTotalTransport = BigDecimal.ZERO;
        BigDecimal grandTotalPerceptions = BigDecimal.ZERO;
        BigDecimal grandTotalDeductions = BigDecimal.ZERO;
        BigDecimal grandTotalNetPay = BigDecimal.ZERO;
        BigDecimal grandTotalEmployerHealth = BigDecimal.ZERO;
        BigDecimal grandTotalEmployerPension = BigDecimal.ZERO;
        BigDecimal grandTotalArl = BigDecimal.ZERO;
        BigDecimal grandTotalCaja = BigDecimal.ZERO;
        BigDecimal grandTotalIcbf = BigDecimal.ZERO;
        BigDecimal grandTotalSena = BigDecimal.ZERO;
        BigDecimal grandTotalCesantias = BigDecimal.ZERO;
        BigDecimal grandTotalPrima = BigDecimal.ZERO;
        BigDecimal grandTotalVacaciones = BigDecimal.ZERO;

        Set<Long> uniqueEmployees = new HashSet<>();

        for (PayrollReceipt r : receipts) {
            uniqueEmployees.add(r.getEmployee().getId());

            grandTotalSalary = grandTotalSalary.add(nullToZero(r.getSalaryAmount()));
            grandTotalOvertime = grandTotalOvertime.add(nullToZero(r.getOvertimeAmount()));
            grandTotalTransport = grandTotalTransport.add(nullToZero(r.getTransportAllowanceAmount()));
            grandTotalPerceptions = grandTotalPerceptions.add(nullToZero(r.getTotalPerceptions()));
            grandTotalDeductions = grandTotalDeductions.add(nullToZero(r.getTotalDeductions()));
            grandTotalNetPay = grandTotalNetPay.add(nullToZero(r.getNetPay()));
            grandTotalEmployerHealth = grandTotalEmployerHealth.add(nullToZero(r.getEmployerHealthContribution()));
            grandTotalEmployerPension = grandTotalEmployerPension.add(nullToZero(r.getEmployerPensionContribution()));
            grandTotalArl = grandTotalArl.add(nullToZero(r.getArlContribution()));
            grandTotalCaja = grandTotalCaja.add(nullToZero(r.getCajaCompensacionContribution()));
            grandTotalIcbf = grandTotalIcbf.add(nullToZero(r.getIcbfContribution()));
            grandTotalSena = grandTotalSena.add(nullToZero(r.getSenaContribution()));
            grandTotalCesantias = grandTotalCesantias.add(nullToZero(r.getCesantiasProvision()));
            grandTotalPrima = grandTotalPrima.add(nullToZero(r.getPrimaServiciosProvision()));
            grandTotalVacaciones = grandTotalVacaciones.add(nullToZero(r.getVacacionesProvision()));
        }

        BigDecimal grandTotalParafiscales = grandTotalIcbf.add(grandTotalSena).add(grandTotalCaja);
        BigDecimal grandTotalSeguridadSocial = grandTotalEmployerHealth.add(grandTotalEmployerPension)
                .add(grandTotalArl);
        BigDecimal grandTotalProvisiones = grandTotalCesantias.add(grandTotalPrima).add(grandTotalVacaciones);

        BigDecimal grandTotalEmployerCost = grandTotalPerceptions
                .add(grandTotalSeguridadSocial)
                .add(grandTotalParafiscales)
                .add(grandTotalProvisiones);

        return SummaryDTO.builder()
                .totalEmployees(uniqueEmployees.size())
                .totalCostCenters(costCenterCount)
                .grandTotalSalary(grandTotalSalary)
                .grandTotalOvertime(grandTotalOvertime)
                .grandTotalTransport(grandTotalTransport)
                .grandTotalPerceptions(grandTotalPerceptions)
                .grandTotalDeductions(grandTotalDeductions)
                .grandTotalNetPay(grandTotalNetPay)
                .grandTotalEmployerHealth(grandTotalEmployerHealth)
                .grandTotalEmployerPension(grandTotalEmployerPension)
                .grandTotalArl(grandTotalArl)
                .grandTotalCaja(grandTotalCaja)
                .grandTotalIcbf(grandTotalIcbf)
                .grandTotalSena(grandTotalSena)
                .grandTotalParafiscales(grandTotalParafiscales)
                .grandTotalSeguridadSocial(grandTotalSeguridadSocial)
                .grandTotalCesantias(grandTotalCesantias)
                .grandTotalPrima(grandTotalPrima)
                .grandTotalVacaciones(grandTotalVacaciones)
                .grandTotalProvisiones(grandTotalProvisiones)
                .grandTotalEmployerCost(grandTotalEmployerCost)
                .build();
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
