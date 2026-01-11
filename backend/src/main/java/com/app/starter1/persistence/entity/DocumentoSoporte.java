package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity for Documento Soporte (DIAN)
 * Equivalent to Invoice but for purchasing from non-electronic billers.
 */
@Entity
@Table(name = "documentos_soporte", indexes = {
        @Index(name = "idx_ds_tenant", columnList = "tenant_id"),
        @Index(name = "idx_ds_numero", columnList = "numero_documento"),
        @Index(name = "idx_ds_proveedor", columnList = "proveedor_numero_documento"),
        @Index(name = "idx_ds_estado", columnList = "estado")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoSoporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Identificación
    @Column(name = "numero_documento", nullable = false, length = 50, unique = true)
    private String numeroDocumento;

    @Column(name = "prefijo_dian", length = 10)
    private String prefijoDian;

    @Column(name = "consecutivo_dian")
    private Long consecutivoDian;

    @Column(name = "cuds", length = 500)
    private String cuds;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_emision")
    private LocalTime horaEmision;

    // Relación Proveedor (Snapshot)
    @Column(name = "proveedor_id")
    private Long proveedorId;

    @Column(name = "proveedor_tipo_documento", length = 2)
    private String proveedorTipoDocumento;

    @Column(name = "proveedor_numero_documento", length = 20)
    private String proveedorNumeroDocumento;

    @Column(name = "proveedor_razon_social", length = 450)
    private String proveedorRazonSocial;

    @Column(name = "proveedor_direccion", length = 500)
    private String proveedorDireccion;

    @Column(name = "proveedor_ciudad", length = 100)
    private String proveedorCiudad;

    @Column(name = "proveedor_departamento", length = 100)
    private String proveedorDepartamento;

    @Column(name = "proveedor_email")
    private String proveedorEmail;

    // Totales
    @Column(name = "subtotal")
    private BigDecimal subtotal;

    @Column(name = "total_descuentos")
    private BigDecimal totalDescuentos;

    @Column(name = "total_impuestos")
    private BigDecimal totalImpuestos;

    @Column(name = "total")
    private BigDecimal total;

    // Estado
    @Column(name = "estado", length = 20)
    private String estado; // BORRADOR, APROBADO, ENVIADO, ACEPTADO, RECHAZADO

    @Column(name = "ambiente_dian", length = 1)
    private String ambienteDian; // 1=Prod, 2=Pruebas

    // XML y respuestas
    @Lob
    @Column(name = "xml_firmado")
    private byte[] xmlFirmado;

    @Lob
    @Column(name = "xml_respuesta_dian")
    private byte[] xmlRespuestaDian;

    @Column(name = "mensaje_dian", columnDefinition = "TEXT")
    private String mensajeDian;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    // Accounting Integration
    @Column(name = "contabilidad_generada")
    @Builder.Default
    private Boolean accountingGenerated = false;

    @Column(name = "asiento_contable_id")
    private Long accountingVoucherId;

    // Items
    @OneToMany(mappedBy = "documentoSoporte", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentoSoporteItem> items = new ArrayList<>();

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    // Methods
    public void calculateTotals() {
        this.subtotal = BigDecimal.ZERO;
        this.totalDescuentos = BigDecimal.ZERO;
        this.totalImpuestos = BigDecimal.ZERO;
        this.total = BigDecimal.ZERO;

        if (items != null) {
            for (DocumentoSoporteItem item : items) {
                if (item.getSubtotal() != null)
                    this.subtotal = this.subtotal.add(item.getSubtotal());
                if (item.getTotal() != null)
                    this.total = this.total.add(item.getTotal());
                // Simple logic, usually total = subtotal - discounts + taxes
                // Assuming items already have calculated totals
            }
        }
    }
}
