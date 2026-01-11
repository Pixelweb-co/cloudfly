package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad InvoiceItem - Línea de factura con soporte completo DIAN UBL 2.1
 */
@Entity
@Table(name = "invoice_items", indexes = {
        @Index(name = "idx_invoice_id", columnList = "invoice_id"),
        @Index(name = "idx_product_id", columnList = "productId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== RELACIÓN CON FACTURA ==========

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Invoice invoice;

    // ========== CAMPOS ORIGINALES (MANTENIDOS) ==========

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false, length = 500)
    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal discount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 12, scale = 2)
    private BigDecimal tax;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    // ========== NUEVOS CAMPOS DIAN PARA FACTURACIÓN ELECTRÓNICA ==========

    // --- Identificación del Producto/Servicio ---

    /**
     * Código del producto/servicio (SKU, código interno, EAN, etc.)
     */
    @Column(name = "codigo_producto", length = 100)
    private String codigoProducto;

    /**
     * Descripción detallada del producto/servicio (OBLIGATORIO DIAN)
     */
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    /**
     * Código UNECE/REC20 de unidad de medida
     * Ejemplos: NIU (Unidad), KGM (Kilogramo), MTR (Metro), HUR (Hora), etc.
     */
    @Column(name = "unidad_medida_unece", length = 10)
    private String unidadMedidaUNECE;

    /**
     * Descripción de la unidad de medida
     */
    @Column(name = "unidad_medida_desc", length = 100)
    private String unidadMedidaDescripcion;

    /**
     * Marca del producto
     */
    @Column(name = "marca", length = 200)
    private String marca;

    /**
     * Modelo del producto
     */
    @Column(name = "modelo", length = 200)
    private String modelo;

    // --- Impuestos Detallados (OBLIGATORIO DIAN) ---

    /**
     * Tipo de impuesto principal: IVA, INC (Impuesto al Consumo), ICA
     */
    @Column(name = "tipo_impuesto", length = 20)
    private String tipoImpuesto;

    /**
     * Tarifa del IVA: 0%, 5%, 19%, EXCLUIDO, EXENTO
     */
    @Column(name = "tarifa_iva", length = 20)
    private String tarifaIVA;

    /**
     * Porcentaje del impuesto (para cálculo)
     */
    @Column(name = "porcentaje_impuesto", precision = 5, scale = 2)
    private BigDecimal porcentajeImpuesto;

    /**
     * Base sobre la cual se calcula el impuesto (generalmente subtotal -
     * descuentos)
     */
    @Column(name = "base_impuesto", precision = 12, scale = 2)
    private BigDecimal baseImpuesto;

    /**
     * Valor del impuesto calculado
     */
    @Column(name = "impuesto_calculado", precision = 12, scale = 2)
    private BigDecimal impuestoCalculado;

    // --- Descuentos y Cargos a Nivel de Línea ---

    /**
     * Descuentos aplicados a esta línea (JSON o separado por comas)
     * Formato: {"motivo": "Descuento temporal", "porcentaje": 10, "valor": 5000}
     */
    @Column(name = "descuentos_linea", columnDefinition = "TEXT")
    private String descuentosLinea;

    /**
     * Valor total de descuentos de la línea
     */
    @Column(name = "valor_descuentos", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal valorDescuentos = BigDecimal.ZERO;

    /**
     * Cargos adicionales aplicados a esta línea
     * Formato: {"motivo": "Transporte", "valor": 2000}
     */
    @Column(name = "cargos_linea", columnDefinition = "TEXT")
    private String cargosLinea;

    /**
     * Valor total de cargos de la línea
     */
    @Column(name = "valor_cargos", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal valorCargos = BigDecimal.ZERO;

    // --- Información Adicional ---

    /**
     * Número de línea en la factura (para orden)
     */
    @Column(name = "numero_linea")
    private Integer numeroLinea;

    /**
     * Indica si el item es gratuito (bonificación, muestra, etc.)
     */
    @Column(name = "es_gratuito")
    @Builder.Default
    private Boolean esGratuito = false;

    /**
     * Notas adicionales de la línea
     */
    @Column(name = "notas_linea", length = 1000)
    private String notasLinea;

    // ========== AUDITORÍA ==========

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * Calcula el subtotal de la línea (cantidad * precio unitario)
     */
    public void calcularSubtotal() {
        if (quantity != null && unitPrice != null) {
            this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    /**
     * Calcula la base imponible (subtotal - descuentos + cargos)
     */
    public void calcularBaseImpuesto() {
        BigDecimal base = subtotal != null ? subtotal : BigDecimal.ZERO;

        if (valorDescuentos != null) {
            base = base.subtract(valorDescuentos);
        }

        if (valorCargos != null) {
            base = base.add(valorCargos);
        }

        this.baseImpuesto = base;
    }

    /**
     * Calcula el impuesto basado en el porcentaje y la base
     */
    public void calcularImpuesto() {
        if (baseImpuesto != null && porcentajeImpuesto != null) {
            this.impuestoCalculado = baseImpuesto.multiply(porcentajeImpuesto)
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            this.tax = this.impuestoCalculado; // Mantener compatibilidad
        }
    }

    /**
     * Calcula el total de la línea (base + impuestos)
     */
    public void calcularTotal() {
        BigDecimal totalCalc = baseImpuesto != null ? baseImpuesto : BigDecimal.ZERO;

        if (impuestoCalculado != null) {
            totalCalc = totalCalc.add(impuestoCalculado);
        }

        this.total = totalCalc;
    }

    /**
     * Ejecuta todos los cálculos en orden
     */
    public void calcularTodo() {
        calcularSubtotal();
        calcularBaseImpuesto();
        calcularImpuesto();
        calcularTotal();
    }

    /**
     * Valida si tiene los datos mínimos para facturación DIAN
     */
    public boolean tieneConfiguracionDianCompleta() {
        return descripcion != null && !descripcion.isEmpty() &&
                unidadMedidaUNECE != null && !unidadMedidaUNECE.isEmpty() &&
                tipoImpuesto != null &&
                baseImpuesto != null &&
                quantity != null && quantity > 0;
    }
}
