package com.app.starter1.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Data
@Getter
@Setter
public class ContractDTO {

    private Long id;
    private LocalDate fechaInicio;
    private LocalDate fechaFinal;
    private String descripcionContrato;
    private String status;

    public ContractDTO(Long id, LocalDate fechaInicio, LocalDate fechaFinal, String descripcionContrato, String status) {
        this.id = id;
        this.fechaInicio = fechaInicio;
        this.fechaFinal = fechaFinal;
        this.descripcionContrato = descripcionContrato;
        this.status = status;
        
    }
}
