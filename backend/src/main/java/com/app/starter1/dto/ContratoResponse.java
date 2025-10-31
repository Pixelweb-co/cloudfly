package com.app.starter1.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@Setter
@Getter
public class ContratoResponse {

    private Long id;
    private LocalDate fechaInicio;
    private LocalDate fechaFinal;
    private String descripcionContrato;
    private String estado;


}
