package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("clientes")
public class CustomerEntity {

    @Id
    private Long id;

    @Column("nombre_cliente")
    private String name;

    @Column("identificacion_cliente")
    private String nit;

    @Column("telefono_cliente")
    private String phone;

    @Column("email_cliente")
    private String email;

    @Column("direccion_cliente")
    private String address;

    @Column("contacto_cliente")
    private String contact;

    @Column("cargo_cliente")
    private String position;

    @Column("tipo_entidad")
    private String type;

    @Column("status_cliente")
    private Boolean status;

    @Column("logo_url")
    private String logoUrl;

    @Column("date_added")
    private LocalDate dateRegister;

    @Column("business_type")
    private String businessType;

    @Column("business_description")
    private String businessDescription;

    @Column("tipo_documento_dian")
    private String tipoDocumentoDian;

    @Column("digito_verificacion")
    private String digitoVerificacion;

    @Column("razon_social")
    private String razonSocial;

    @Column("nombre_comercial")
    private String nombreComercial;

    @Column("responsabilidades_fiscales")
    private String responsabilidadesFiscales;

    @Column("regimen_fiscal")
    private String regimenFiscal;

    @Column("obligaciones_dian")
    private String obligacionesDian;

    @Column("codigo_dane_ciudad")
    private String codigoDaneCiudad;

    @Column("ciudad_dian")
    private String ciudadDian;

    @Column("codigo_dane_departamento")
    private String codigoDaneDepartamento;

    @Column("departamento_dian")
    private String departamentoDian;

    @Column("pais_codigo")
    private String paisCodigo;

    @Column("pais_nombre")
    private String paisNombre;

    @Column("codigo_postal")
    private String codigoPostal;

    @Column("actividad_economica_ciiu")
    private String actividadEconomicaCiiu;

    @Column("actividad_economica_desc")
    private String actividadEconomicaDescripcion;

    @Column("email_facturacion_dian")
    private String emailFacturacionDian;

    @Column("sitio_web")
    private String sitioWeb;

    @Column("representante_legal_nombre")
    private String representanteLegalNombre;

    @Column("representante_legal_tipo_doc")
    private String representanteLegalTipoDoc;

    @Column("representante_legal_numero_doc")
    private String representanteLegalNumeroDoc;

    @Column("es_emisor_fe")
    private Boolean esEmisorFE;

    @Column("es_emisor_principal")
    private Boolean esEmisorPrincipal;

    @Column("notas_dian")
    private String notasDian;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
