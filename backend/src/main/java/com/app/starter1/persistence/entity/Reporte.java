package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "det_solicitud")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reporte {

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_solicitud")
    private Long solicitud;

    @Column(name = "estado_equipo")
    private Integer estadoEquipo;

    @Column(name = "ubicacion", length = 120)
    private String ubicacion;

    @Column(name = "trabajo_rea", columnDefinition = "TEXT")
    private String trabajoRealizado;

    @Column(name = "obser", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "hora_ini", length = 14)
    private String horaInicio;

    @Column(name = "hora_fin", length = 14)
    private String horaFin;

    @Column(name = "dife", length = 14)
    private String diferencia;

    @Column(name = "repuesto", columnDefinition = "TEXT")
    private String repuesto;

    @Column(name = "recibe", length = 120)
    private String recibe;

    @Column(name = "firma", length = 80)
    private String firma;

    @Column(name = "ciudad", length = 120)
    private String ciudad;
}
