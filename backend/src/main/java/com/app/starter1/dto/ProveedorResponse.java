package com.app.starter1.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProveedorResponse {

    private Long id;
    private Long tenantId;
    private String tipoDocumento;
    private String numeroDocumento;
    private String dv;
    private String nitCompleto;
    private String razonSocial;
    private String nombreComercial;
    private String direccion;
    private String telefono;
    private String email;
    private String codigoDaneCiudad;
    private String ciudad;
    private String codigoDaneDepartamento;
    private String departamento;
    private String pais;
    private String responsabilidadesFiscales;
    private String regimenFiscal;
    private Boolean activo;
    private Boolean esFacturadorElectronico;
    private String notas;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}
