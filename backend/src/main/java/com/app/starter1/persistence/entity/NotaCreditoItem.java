package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Item de Nota de Crédito - similar a InvoiceItem
 */
@Entity
@Table(name = "nota_credito_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaCreditoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nota_credito_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private NotaCredito notaCredito;

    @Column(name = "numero_linea")
    private Integer numeroLinea;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false, length = 500)
    private String productName;

    @Column(length = 100)
    private String codigoProducto;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Campos DIAN
    @Column(name = "unidad_medida_unece", length = 10)
    private String unidadMedidaUNECE;

    @Column(name = "tipo_impuesto", length = 20)
    private String tipoImpuesto;

    @Column(name = "porcentaje_impuesto", precision = 5, scale = 2)
    private BigDecimal porcentajeImpuesto;

    @Column(name = "base_impuesto", precision = 12, scale = 2)
    private BigDecimal baseImpuesto;

    @Column(name = "impuesto_calculado", precision = 12, scale = 2)
    private BigDecimal impuestoCalculado;

    @Column(name = "valor_descuentos", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal valorDescuentos = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;
}
