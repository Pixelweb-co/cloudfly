package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "documento_soporte_items", indexes = {
        @Index(name = "idx_dsi_doc", columnList = "documento_soporte_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoSoporteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_soporte_id", nullable = false)
    private DocumentoSoporte documentoSoporte;

    @Column(name = "numero_linea")
    private Integer numeroLinea;

    @Column(name = "product_name", nullable = false, length = 500)
    private String productName;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "subtotal")
    private BigDecimal subtotal;

    // DIAN Fields
    @Column(name = "unidad_medida_unece", length = 10)
    private String unidadMedida; // UNECE

    @Column(name = "porcentaje_impuesto")
    private BigDecimal porcentajeImpuesto;

    @Column(name = "impuesto_calculado")
    private BigDecimal impuestoCalculado;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "total", nullable = false)
    private BigDecimal total;

    public void calculateTotals() {
        if (this.subtotal == null) {
            this.subtotal = calculateSubtotal();
        }
        if (this.impuestoCalculado == null) {
            this.impuestoCalculado = calculateTax();
        }
        this.total = this.subtotal.add(this.impuestoCalculado != null ? this.impuestoCalculado : BigDecimal.ZERO);
    }

    private BigDecimal calculateSubtotal() {
        if (this.quantity != null && this.unitPrice != null) {
            return this.unitPrice.multiply(BigDecimal.valueOf(this.quantity));
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateTax() {
        BigDecimal sub = (this.subtotal != null) ? this.subtotal : calculateSubtotal();
        if (sub != null && this.porcentajeImpuesto != null) {
            return sub.multiply(this.porcentajeImpuesto).divide(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }
}
