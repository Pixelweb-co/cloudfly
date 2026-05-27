package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad Customer - Información de cliente/emisor con soporte completo DIAN
 * para facturación electrónica UBL 2.1 Colombia
 */
@Setter
@Getter
@Builder
@Table(name = "clientes", indexes = {
        @Index(name = "idx_nit", columnList = "identificacion_cliente"),
        @Index(name = "idx_status", columnList = "status_cliente")
})
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== CAMPOS ORIGINALES (MANTENIDOS) ==========

    @Column(name = "nombre_cliente", nullable = false)
    private String name;

    @Column(name = "identificacion_cliente", unique = false, nullable = true)
    private String nit;

    @Column(name = "telefono_cliente", nullable = true)
    private String phone;

    @Column(name = "email_cliente", nullable = true)
    private String email;

    @Column(name = "direccion_cliente", nullable = true)
    private String address;

    @Column(name = "contacto_cliente", nullable = true)
    private String contact;

    @Column(name = "cargo_cliente", nullable = true)
    private String position;

    @Column(name = "tipo_entidad", nullable = true)
    private String type;

    @Column(name = "status_cliente", nullable = true)
    private Boolean status;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "date_added", nullable = true)
    private LocalDate dateRegister;

    /**
     * Tipo de negocio del cliente
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", length = 30)
    private BusinessType businessType;

    /**
     * Descripción detallada del negocio / objeto social
     */
    @Column(name = "business_description", columnDefinition = "TEXT")
    private String businessDescription;

    // ========== NUEVOS CAMPOS DIAN PARA FACTURACIÓN ELECTRÓNICA ==========

    // NOTA: El campo 'id' ya representa el tenant_id en esta aplicación

    // --- Identificación Tributaria DIAN ---

    /**
     * Tipo de documento DIAN: 31=NIT, 13=CC, 22=CE, 41=Pasaporte, etc.
     */
    @Column(name = "tipo_documento_dian", length = 2)
    private String tipoDocumentoDian;

    /**
     * Dígito de verificación (solo para NIT)
     */
    @Column(name = "digito_verificacion", length = 1)
    private String digitoVerificacion;

    // --- Nombres Legales y Comerciales ---

    /**
     * Razón social completa (nombre legal registrado)
     */
    @Column(name = "razon_social", length = 450)
    private String razonSocial;

    /**
     * Nombre comercial (puede diferir de razón social)
     */
    @Column(name = "nombre_comercial", length = 450)
    private String nombreComercial;

    // --- Responsabilidades Fiscales DIAN ---

    /**
     * Responsabilidades fiscales separadas por coma
     * Ejemplos: R-99-PN, O-13, O-15, O-23, O-47
     */
    @Column(name = "responsabilidades_fiscales", length = 500)
    private String responsabilidadesFiscales;

    /**
     * Régimen fiscal: COMUN, SIMPLE, ESPECIAL
     */
    @Column(name = "regimen_fiscal", length = 20)
    private String regimenFiscal;

    /**
     * Obligaciones DIAN separadas por coma
     */
    @Column(name = "obligaciones_dian", length = 500)
    private String obligacionesDian;

    // --- Ubicación Geográfica DIAN ---

    /**
     * Código DANE de la ciudad (5 dígitos)
     */
    @Column(name = "codigo_dane_ciudad", length = 5)
    private String codigoDaneCiudad;

    /**
     * Nombre de la ciudad
     */
    @Column(name = "ciudad_dian", length = 100)
    private String ciudadDian;

    /**
     * Código DANE del departamento (2 dígitos)
     */
    @Column(name = "codigo_dane_departamento", length = 2)
    private String codigoDaneDepartamento;

    /**
     * Nombre del departamento
     */
    @Column(name = "departamento_dian", length = 100)
    private String departamentoDian;

    /**
     * Código de país (siempre "CO" para Colombia)
     */
    @Column(name = "pais_codigo", length = 2)
    @Builder.Default
    private String paisCodigo = "CO";

    /**
     * Nombre del país
     */
    @Column(name = "pais_nombre", length = 100)
    @Builder.Default
    private String paisNombre = "Colombia";

    /**
     * Código postal
     */
    @Column(name = "codigo_postal", length = 10)
    private String codigoPostal;

    // --- Información Económica ---

    /**
     * Código CIIU de actividad económica principal
     */
    @Column(name = "actividad_economica_ciiu", length = 10)
    private String actividadEconomicaCiiu;

    /**
     * Descripción de la actividad económica
     */
    @Column(name = "actividad_economica_desc", length = 500)
    private String actividadEconomicaDescripcion;

    // --- Contacto Facturación Electrónica ---

    /**
     * Email específico para facturación electrónica
     */
    @Column(name = "email_facturacion_dian", length = 255)
    private String emailFacturacionDian;

    /**
     * Sitio web
     */
    @Column(name = "sitio_web", length = 255)
    private String sitioWeb;

    // --- Representante Legal ---

    /**
     * Nombre completo del representante legal
     */
    @Column(name = "representante_legal_nombre", length = 255)
    private String representanteLegalNombre;

    /**
     * Tipo de documento del representante
     */
    @Column(name = "representante_legal_tipo_doc", length = 2)
    private String representanteLegalTipoDoc;

    /**
     * Número de documento del representante
     */
    @Column(name = "representante_legal_numero_doc", length = 20)
    private String representanteLegalNumeroDoc;

    // --- Configuración Facturación Electrónica ---

    /**
     * Indica si este customer es un EMISOR de facturas electrónicas
     */
    @Column(name = "es_emisor_fe", nullable = false)
    @Builder.Default
    private Boolean esEmisorFE = false;

    /**
     * Indica si es el emisor principal del tenant (para multi-empresa)
     */
    @Column(name = "es_emisor_principal", nullable = false)
    @Builder.Default
    private Boolean esEmisorPrincipal = false;

    /**
     * Notas internas sobre configuración DIAN
     */
    @Column(name = "notas_dian", columnDefinition = "TEXT")
    private String notasDian;

    // ========== AUDITORÍA ==========

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ========== MÉTODOS AUXILIARES ==========

    @PrePersist
    public void prePersist() {
        if (this.dateRegister == null) {
            this.dateRegister = LocalDate.now();
        }
        if (this.paisCodigo == null) {
            this.paisCodigo = "CO";
        }
        if (this.paisNombre == null) {
            this.paisNombre = "Colombia";
        }
    }

    /**
     * Obtiene el NIT completo con dígito de verificación
     */
    public String getNitCompleto() {
        if (nit != null && digitoVerificacion != null && !digitoVerificacion.isEmpty()) {
            return nit + "-" + digitoVerificacion;
        }
        return nit;
    }

    /**
     * Obtiene las responsabilidades fiscales como array
     */
    public String[] getResponsabilidadesFiscalesArray() {
        if (responsabilidadesFiscales == null || responsabilidadesFiscales.isEmpty()) {
            return new String[0];
        }
        return responsabilidadesFiscales.split(",");
    }

    /**
     * Obtiene las obligaciones DIAN como array
     */
    public String[] getObligacionesDianArray() {
        if (obligacionesDian == null || obligacionesDian.isEmpty()) {
            return new String[0];
        }
        return obligacionesDian.split(",");
    }

    /**
     * Obtiene el nombre para facturación (prioridad: razón social > nombre
     * comercial > name)
     */
    public String getNombreParaFacturacion() {
        if (razonSocial != null && !razonSocial.isEmpty()) {
            return razonSocial;
        }
        if (nombreComercial != null && !nombreComercial.isEmpty()) {
            return nombreComercial;
        }
        return name;
    }

    /**
     * Valida si tiene los datos mínimos para ser emisor DIAN
     */
    public boolean tieneConfiguracionDianCompleta() {
        return tipoDocumentoDian != null &&
                nit != null && !nit.isEmpty() &&
                razonSocial != null && !razonSocial.isEmpty() &&
                address != null && !address.isEmpty() &&
                ciudadDian != null &&
                departamentoDian != null &&
                (emailFacturacionDian != null || email != null);
    }

    // Enum para tipo de negocio (MANTENIDO)
    public enum BusinessType {
        VENTAS, // Venta de productos físicos o digitales
        AGENDAMIENTO, // Servicios con citas o reservas
        SUSCRIPCION, // Modelo de suscripción recurrente
        MIXTO // Combinación de varios tipos
    }
}
