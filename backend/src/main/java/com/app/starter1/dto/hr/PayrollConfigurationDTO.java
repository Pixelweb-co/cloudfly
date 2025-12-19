package com.app.starter1.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para la configuración de nómina del tenant
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollConfigurationDTO {

    private Long id;
    private Long customerId;

    // === PRESTACIONES SOCIALES ===
    private Integer aguinaldoDays; // Días de aguinaldo (default: 15)
    private Integer vacationDaysPerYear; // Días de vacaciones al año
    private BigDecimal vacationPremiumPercentage; // Prima vacacional %

    // === IMPUESTOS Y DEDUCCIONES ===
    private Boolean applyIsr; // ¿Aplicar ISR?
    private Boolean applyImss; // ¿Aplicar IMSS/EPS?
    private BigDecimal imssWorkerPercentage; // Cuota obrera
    private BigDecimal imssEmployerPercentage; // Cuota patronal

    // === SALARIOS DE REFERENCIA ===
    private BigDecimal minimumWage; // Salario mínimo
    private BigDecimal umaValue; // UMA (México) / SMMLV (Colombia)

    // === TIMBRADO CFDI (México) ===
    private Boolean enableCfdiTimbrado;
    private String pacProvider;
    private String pacApiKey;
    private String pacApiUrl;

    // === DISPERSIÓN BANCARIA ===
    private String bankLayoutFormat;

    // === INTEGRACIÓN CONTABLE ===
    private Boolean enableAccountingIntegration;
    private String payrollExpenseAccount; // Cuenta de gastos de nómina
    private String taxesPayableAccount; // Cuenta de impuestos por pagar
    private String salariesPayableAccount; // Cuenta de sueldos por pagar

    // === NOTIFICACIONES ===
    private Boolean sendReceiptsByEmail;
    private Boolean sendReceiptsByWhatsapp;

    // === CONFIGURACIÓN COLOMBIA ===
    private BigDecimal healthPercentageEmployee; // % Salud empleado (4%)
    private BigDecimal healthPercentageEmployer; // % Salud empleador (8.5%)
    private BigDecimal pensionPercentageEmployee; // % Pensión empleado (4%)
    private BigDecimal pensionPercentageEmployer; // % Pensión empleador (12%)
    private BigDecimal solidarityFundPercentage; // Fondo de solidaridad (>4 SMMLV)
    private BigDecimal arlPercentage; // % ARL (según riesgo)
    private BigDecimal transportAllowance; // Auxilio de transporte
    private BigDecimal parafiscalCajaPercentage; // % Caja de compensación (4%)
    private BigDecimal parafiscalSenaPercentage; // % SENA (2%)
    private BigDecimal parafiscalIcbfPercentage; // % ICBF (3%)
}
