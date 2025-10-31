package com.app.starter1.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SolicitudDTO {
    private Long idSolicitud;
    private String fecha;
    private String hora;
    private String asig;
    private Long status;
    private Long idEquipo;
    private Long idTipoDevice;
    private String entidad;
    private String tipoServicio;
    private String descr;
    private String color;
    private List<Long> productsToInsert;
}

