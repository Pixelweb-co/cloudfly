package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Totales consolidados para el XML DIAN
 */
@Entity
@Table(name = "payroll_totales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollTotales {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_receipt_id", nullable = false, unique = true)
    @JsonIgnore
    @ToString.Exclude
    private PayrollReceipt payrollReceipt;

    // === DEVENGADOS ===
    @Column(name = "devengado_total", precision = 15, scale = 2)
    private BigDecimal devengadoTotal;

    @Column(name = "sueldo_trabajado", precision = 15, scale = 2)
    private BigDecimal sueldoTrabajado;

    @Column(name = "auxilio_transporte", precision = 15, scale = 2)
    private BigDecimal auxilioTransporte;

    // === DEDUCCIONES ===
    @Column(name = "deduccion_total", precision = 15, scale = 2)
    private BigDecimal deduccionTotal;

    @Column(name = "salud_total", precision = 15, scale = 2)
    private BigDecimal saludTotal;

    @Column(name = "pension_total", precision = 15, scale = 2)
    private BigDecimal pensionTotal;

    @Column(name = "fondo_sp_total", precision = 15, scale = 2)
    private BigDecimal fondoSPTotal; // Fondo Solidaridad y Subsistencia

    // === NETO ===
    @Column(name = "comprobante_total", precision = 15, scale = 2)
    private BigDecimal comprobanteTotal; // Neto a pagar (Devengado - Deducciones)

    // === PROVISIONES (Informativo, no va en el XML de nómina individual
    // generalmente) ===
    @Column(name = "total_provisiones", precision = 15, scale = 2)
    private BigDecimal totalProvisiones;

    @Column(name = "total_costo_empleador", precision = 15, scale = 2)
    private BigDecimal totalCostoEmpleador;
}
