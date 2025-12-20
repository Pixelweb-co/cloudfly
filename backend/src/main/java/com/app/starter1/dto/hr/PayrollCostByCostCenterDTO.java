package com.app.starter1.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para el reporte de costos de nómina por centro de costo
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollCostByCostCenterDTO {

    private Long periodId;
    private Integer periodYear;
    private Integer periodNumber;
    private String periodType;
    private String periodName;

    private List<CostCenterCostDTO> costCenters;
    private SummaryDTO summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostCenterCostDTO {
        private Long costCenterId;
        private String costCenterCode;
        private String costCenterName;

        private Integer employeeCount;

        // Devengos
        private BigDecimal totalSalary;
        private BigDecimal totalOvertime;
        private BigDecimal totalTransport;
        private BigDecimal totalPerceptions;

        // Deducciones del empleado
        private BigDecimal totalDeductions;
        private BigDecimal totalNetPay;

        // Aportes del empleador
        private BigDecimal totalEmployerHealth;
        private BigDecimal totalEmployerPension;
        private BigDecimal totalArl;
        private BigDecimal totalCaja;
        private BigDecimal totalIcbf;
        private BigDecimal totalSena;

        // Provisiones
        private BigDecimal totalCesantias;
        private BigDecimal totalPrima;
        private BigDecimal totalVacaciones;

        // Costo total para el empleador
        private BigDecimal totalEmployerCost;

        // Porcentaje del total
        private BigDecimal percentageOfTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryDTO {
        private Integer totalEmployees;
        private Integer totalCostCenters;

        private BigDecimal grandTotalSalary;
        private BigDecimal grandTotalOvertime;
        private BigDecimal grandTotalTransport;
        private BigDecimal grandTotalPerceptions;
        private BigDecimal grandTotalDeductions;
        private BigDecimal grandTotalNetPay;

        // Aportes patronales
        private BigDecimal grandTotalEmployerHealth;
        private BigDecimal grandTotalEmployerPension;
        private BigDecimal grandTotalArl;
        private BigDecimal grandTotalCaja;
        private BigDecimal grandTotalIcbf;
        private BigDecimal grandTotalSena;
        private BigDecimal grandTotalParafiscales; // ICBF + SENA + Caja
        private BigDecimal grandTotalSeguridadSocial; // Salud + Pensión + ARL

        // Provisiones
        private BigDecimal grandTotalCesantias;
        private BigDecimal grandTotalPrima;
        private BigDecimal grandTotalVacaciones;
        private BigDecimal grandTotalProvisiones;

        // Costo total empleador
        private BigDecimal grandTotalEmployerCost;
    }
}
