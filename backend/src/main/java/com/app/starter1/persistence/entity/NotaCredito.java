package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad NotaCredito - Nota Crédito Electrónica DIAN UBL 2.1
 * Anula o ajusta (disminuye) el valor de una factura electrónica
 */
@Entity
@Table(name = "notas_credito", indexes = {
                @Index(name = "idx_nc_tenant", columnList = "tenant_id"),
                @Index(name = "idx_nc_invoice_ref", columnList = "invoice_id_referencia"),
                @Index(name = "idx_nc_numero", columnList = "numero_nota_credito"),
                @Index(name = "idx_nc_estado", columnList = "estado"),
                @Index(name = "idx_nc_cufe", columnList = "cufe")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaCredito {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        // ========== MULTI-TENANCY ==========

        @Column(name = "tenant_id", nullable = false)
        private Long tenantId;

        // ========== IDENTIFICACIÓN DE LA NOTA ==========

        /**
         * Número interno de la nota de crédito
         */
        @Column(name = "numero_nota_credito", unique = true, length = 50)
        private String numeroNotaCredito;

        /**
         * Prefijo DIAN para notas de crédito (ej: NC)
         */
        @Column(name = "prefijo_dian", length = 10)
        private String prefijoDian;

        /**
         * Número consecutivo DIAN
         */
        @Column(name = "consecutivo_dian")
        private Long consecutivoDian;

        /**
         * CUFE de esta nota de crédito (generado al firmar)
         */
        @Column(name = "cufe", length = 500)
        private String cufe;

        // ========== REFERENCIA A FACTURA ORIGINAL ==========

        /**
         * ID de la factura que se está afectando
         */
        @Column(name = "invoice_id_referencia", nullable = false)
        private Long invoiceIdReferencia;

        /**
         * CUFE de la factura original
         */
        @Column(name = "cufe_factura_original", length = 500)
        private String cufeFacturaOriginal;

        /**
         * Número de la factura original
         */
        @Column(name = "numero_factura_original", length = 50)
        private String numeroFacturaOriginal;

        /**
         * Fecha de la factura original
         */
        @Column(name = "fecha_factura_original")
        private LocalDate fechaFacturaOriginal;

        // ========== MOTIVO Y CLASIFICACIÓN DIAN ==========

        /**
         * Motivo de la nota de crédito
         */
        @Column(name = "motivo", columnDefinition = "TEXT", nullable = false)
        private String motivo;

        /**
         * Código del motivo según DIAN
         * 1 = Anulación de factura electrónica
         * 2 = Anulación parcial de factura electrónica
         * 3 = Rebaja total aplicada
         * 4 = Rebaja parcial aplicada
         * 5 = Descuento total o parcial
         */
        @Column(name = "codigo_motivo_dian", length = 2)
        private String codigoMotivoDian;

        // ========== FECHAS ==========

        /**
         * Fecha de emisión de la nota de crédito
         */
        @Column(name = "fecha_emision", nullable = false)
        private LocalDate fechaEmision;

        /**
         * Hora de emisión
         */
        @Column(name = "hora_emision")
        private java.time.LocalTime horaEmision;

        // ========== DETALLES/ITEMS ==========

        /**
         * Ítems de la nota de crédito (relación OneToMany)
         */
        @OneToMany(mappedBy = "notaCredito", cascade = CascadeType.ALL, orphanRemoval = true)
        @Builder.Default
        private List<NotaCreditoItem> items = new ArrayList<>();

        // ========== TOTALES ==========

        /**
         * Subtotal (suma de líneas sin impuestos)
         */
        @Column(name = "subtotal", precision = 15, scale = 2)
        private BigDecimal subtotal;

        /**
         * Total descuentos
         */
        @Column(name = "total_descuentos", precision = 15, scale = 2)
        @Builder.Default
        private BigDecimal totalDescuentos = BigDecimal.ZERO;

        /**
         * Total impuestos
         */
        @Column(name = "total_impuestos", precision = 15, scale = 2)
        private BigDecimal totalImpuestos;

        /**
         * Total de la nota
         */
        @Column(name = "total", precision = 15, scale = 2, nullable = false)
        private BigDecimal total;

        // ========== ESTADO Y CONTROL ==========

        /**
         * Estado de la nota de crédito
         */
        @Enumerated(EnumType.STRING)
        @Column(name = "estado", length = 20, nullable = false)
        @Builder.Default
        private EstadoNotaCredito estado = EstadoNotaCredito.BORRADOR;

        /**
         * Ambiente DIAN (1=Producción, 2=Pruebas)
         */
        @Column(name = "ambiente_dian", length = 1)
        private String ambienteDian;

        /**
         * XML firmado de la nota
         */
        @Lob
        @Column(name = "xml_firmado", columnDefinition = "LONGBLOB")
        private byte[] xmlFirmado;

        /**
         * XML de respuesta DIAN
         */
        @Lob
        @Column(name = "xml_respuesta_dian", columnDefinition = "LONGBLOB")
        private byte[] xmlRespuestaDian;

        /**
         * Mensaje de respuesta DIAN
         */
        @Column(name = "mensaje_dian", columnDefinition = "TEXT")
        private String mensajeDian;

        /**
         * Indica si ya se revirtieron los movimientos contables
         */
        @Column(name = "contabilidad_revertida")
        @Builder.Default
        private Boolean contabilidadRevertida = false;

        /**
         * ID del asiento contableReversion que se generó
         */
        @Column(name = "asiento_reversion_id")
        private Long asientoReversionId;

        // ========== AUDITORÍA ==========

        @CreationTimestamp
        @Column(name = "created_at", updatable = false)
        private LocalDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @Column(name = "created_by", length = 100)
        private String createdBy;

        @Column(name = "approved_by", length = 100)
        private String approvedBy;

        @Column(name = "approved_at")
        private LocalDateTime approvedAt;

        // ========== MÉTODOS AUXILIARES ==========

        /**
         * Calcula los totales de la nota
         */
        public void calcularTotales() {
                this.subtotal = items.stream()
                                .map(item -> item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                this.totalImpuestos = items.stream()
                                .map(item -> item.getImpuestoCalculado() != null ? item.getImpuestoCalculado()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                this.totalDescuentos = items.stream()
                                .map(item -> item.getValorDescuentos() != null ? item.getValorDescuentos()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                this.total = items.stream()
                                .map(item -> item.getTotal() != null ? item.getTotal() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        /**
         * Agrega un item a la nota
         */
        public void addItem(NotaCreditoItem item) {
                items.add(item);
                item.setNotaCredito(this);
        }

        /**
         * Enum de estados
         */
        public enum EstadoNotaCredito {
                BORRADOR, // En construcción
                APROBADA, // Aprobada internamente
                ENVIADA, // Enviada a DIAN
                ACEPTADA, // Aceptada por DIAN
                RECHAZADA // Rechazada por DIAN
        }
}
