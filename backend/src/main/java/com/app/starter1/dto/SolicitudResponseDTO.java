package com.app.starter1.dto;

import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.services.TypeServiceService;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class SolicitudResponseDTO {
    private Long idSolicitud;
    private String fecha;
    private String hora;
    private String nombreEquipo;
    private String nombreTipoServicio;
    private String nombreEntidad;
    private String nombreEstadoSolicitud;
    private UserEntity asig;
    private EstadoSolicitud status;
    private Long idEquipo;
    private Long idTipoDevice;
    private Long entidad;
    private Long tipoServicio;
    private String descripcion;
    private String color;
    private Reporte reporte;
    private List<TipoServicio> typeServiceServiceList;
    private Customer customer;
    private Product equipo;
}
