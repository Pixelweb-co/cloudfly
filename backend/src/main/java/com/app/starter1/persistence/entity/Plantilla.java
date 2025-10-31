package com.app.starter1.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Entity
@Data
@Builder
@AllArgsConstructor
@Table(name = "plantillas")
@NoArgsConstructor
public class Plantilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_plantilla", length = 40, nullable = false)
    private Long id;

    @Column(name = "tipo_element")
    private Long tipoElement;

    @Column(length = 80)
    private String marca;

    @Column(length = 80)
    private String modelo;

    @Column(length = 120)
    private String nom;

    @Column(length = 80)
    private Long tipo;

    private Integer valor;

    @Column(length = 12)
    private String alias;

    @Column(name = "date_time")
    private LocalDateTime dateTime;
}

