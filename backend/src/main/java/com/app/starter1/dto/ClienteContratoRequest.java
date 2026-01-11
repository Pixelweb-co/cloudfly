package com.app.starter1.dto;

import lombok.Data;

@Data
public class ClienteContratoRequest {
    // Basic Fields
    private Long id;
    private String name;
    private String nit;
    private String phone;
    private String email;
    private String address;
    private String contact;
    private String position;
    private String type;
    private String fechaInicio;
    private String fechaFinal;
    private String descripcionContrato;
    private Integer status; // 1 = Activo, 0 = Inactivo

    // ========== CAMPOS DIAN PARA FACTURACIÓN ELECTRÓNICA ==========

    // Identificación Tributaria
    private String tipoDocumentoDian;
    private String digitoVerificacion;

    // Nombres Legales
    private String razonSocial;
    private String nombreComercial;

    // Responsabilidades Fiscales
    private String responsabilidadesFiscales;
    private String regimenFiscal;
    private String obligacionesDian;

    // Ubicación Geográfica DIAN
    private String codigoDaneCiudad;
    private String ciudadDian;
    private String codigoDaneDepartamento;
    private String departamentoDian;
    private String paisCodigo;
    private String paisNombre;
    private String codigoPostal;

    // Información Económica
    private String actividadEconomicaCiiu;
    private String actividadEconomicaDescripcion;

    // Contacto Facturación Electrónica
    private String emailFacturacionDian;
    private String sitioWeb;

    // Representante Legal
    private String representanteLegalNombre;
    private String representanteLegalTipoDoc;
    private String representanteLegalNumeroDoc;

    // Configuración Facturación Electrónica
    private Boolean esEmisorFE;
    private Boolean esEmisorPrincipal;
    private String notasDian;
}
