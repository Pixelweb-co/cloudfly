package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad Proveedor - Maestro de proveedores (similar a Customer pero para
 * compras)
 */
@Entity
@Table(name = "proveedores", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_nit_proveedor", columnNames = { "tenant_id", "numero_documento" })
}, indexes = {
        @Index(name = "idx_prov_tenant", columnList = "tenant_id"),
        @Index(name = "idx_prov_nit", columnList = "numero_documento"),
        @Index(name = "idx_prov_activo", columnList = "activo")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Identificación
    @Column(name = "tipo_documento", nullable = false, length = 2)
    private String tipoDocumento; // 13=CC, 22=CE, 31=NIT

    @Column(name = "numero_documento", nullable = false, length = 20)
    private String numeroDocumento;

    @Column(name = "dv", length = 1)
    private String dv;

    // Nombres
    @Column(name = "razon_social", nullable = false, length = 450)
    private String razonSocial;

    @Column(name = "nombre_comercial", length = 450)
    private String nombreComercial;

    // Contacto
    @Column(name = "direccion", length = 500)
    private String direccion;

    @Column(name = "telefono", length = 50)
    private String telefono;

    @Column(name = "email", length = 255)
    private String email;

    // Ubicación
    @Column(name = "codigo_dane_ciudad", length = 5)
    private String codigoDaneCiudad;

    @Column(name = "ciudad", length = 100)
    private String ciudad;

    @Column(name = "codigo_dane_departamento", length = 2)
    private String codigoDaneDepartamento;

    @Column(name = "departamento", length = 100)
    private String departamento;

    @Column(name = "pais", length = 2)
    @Builder.Default
    private String pais = "CO";

    // Información fiscal
    @Column(name = "responsabilidades_fiscales", length = 500)
    private String responsabilidadesFiscales;

    @Column(name = "regimen_fiscal", length = 20)
    private String regimenFiscal;

    // Control
    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "es_facturador_electronico")
    @Builder.Default
    private Boolean esFacturadorElectronico = false;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    // Métodos auxiliares
    public String getNitCompleto() {
        if (dv != null && !dv.isEmpty()) {
            return numeroDocumento + "-" + dv;
        }
        return numeroDocumento;
    }
}
