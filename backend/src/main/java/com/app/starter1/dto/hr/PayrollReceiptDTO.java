package com.app.starter1.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollReceiptDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private Long periodId;
    private String periodName;
    private String receiptNumber;
    private LocalDateTime calculationDate;

    // Días trabajados
    private BigDecimal regularDays;
    private BigDecimal absenceDays;
    private BigDecimal overtimeHours;

    // Salarios base
    private BigDecimal baseSalary;
    private BigDecimal dailySalary;

    // Devengos detallados
    private DevengosDTO devengos;

    // Deducciones detalladas
    private DeduccionesDTO deducciones;

    // Costos del empleador (opcional, solo para admin/contabilidad)
    private CostosEmpleadorDTO costosEmpleador;

    // Provisiones (opcional, solo para admin/contabilidad)
    private ProvisionesDTO provisiones;

    // Totales
    private BigDecimal totalPerceptions;
    private BigDecimal totalDeductions;
    private BigDecimal netPay;
    private BigDecimal totalEmployerCosts;
    private BigDecimal totalProvisions;
    private BigDecimal totalCost; // Costo total para la empresa

    // Estado y metadatos de pago
    private String status;
    private LocalDateTime paidAt;
    private String paymentReference;
    private String paymentMethod;
    private String notes;

    // Contabilidad
    private Boolean accountingGenerated;
    private Long accountingVoucherId;

    // Archivos
    private String pdfPath;
    private Boolean emailSent;

    // Campos auxiliares
    private Boolean isPaid;

    // ===== DTOs Anidados =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DevengosDTO {
        private BigDecimal salario;
        private BigDecimal horasExtras;
        private BigDecimal comisiones;
        private BigDecimal auxilioTransporte;
        private BigDecimal bonos;
        private BigDecimal otros;
        private BigDecimal total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeduccionesDTO {
        private BigDecimal salud;
        private BigDecimal pension;
        private BigDecimal otras;
        private BigDecimal total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostosEmpleadorDTO {
        private BigDecimal saludEmpleador;
        private BigDecimal pensionEmpleador;
        private BigDecimal arl;
        private BigDecimal sena;
        private BigDecimal icbf;
        private BigDecimal cajaCompensacion;
        private BigDecimal total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProvisionesDTO {
        private BigDecimal prima;
        private BigDecimal cesantias;
        private BigDecimal interesesCesantias;
        private BigDecimal vacaciones;
        private BigDecimal total;
    }
}
