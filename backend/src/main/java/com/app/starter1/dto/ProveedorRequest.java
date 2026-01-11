package com.app.starter1.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProveedorRequest {

    @NotBlank(message = "El tipo de documento es obligatorio")
    @Size(max = 2)
    private String tipoDocumento;

    @NotBlank(message = "El número de documento es obligatorio")
    @Size(max = 20)
    private String numeroDocumento;

    @Size(max = 1)
    private String dv;

    @NotBlank(message = "La razón social es obligatoria")
    @Size(max = 450)
    private String razonSocial;

    @Size(max = 450)
    private String nombreComercial;

    @Size(max = 500)
    private String direccion;

    @Size(max = 50)
    private String telefono;

    @Email
    @Size(max = 255)
    private String email;

    @Size(max = 5)
    private String codigoDaneCiudad;

    @Size(max = 100)
    private String ciudad;

    @Size(max = 2)
    private String codigoDaneDepartamento;

    @Size(max = 100)
    private String departamento;

    @Size(max = 2)
    private String pais;

    @Size(max = 500)
    private String responsabilidadesFiscales;

    @Size(max = 20)
    private String regimenFiscal;

    private Boolean activo;
    private Boolean esFacturadorElectronico;
    private String notas;
}
