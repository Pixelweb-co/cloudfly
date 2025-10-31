package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Entity
@Data
@Builder
@AllArgsConstructor
@Table(name = "verification_templates")
@NoArgsConstructor
public class PlantillaVerificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_plantilla", length = 40, nullable = false)
    private Long id;

    @Column(name = "templateName")
    private String templateName;
    @Column(name = "equimentlist" , columnDefinition = "TEXT")
    private String equimentlist;
    @Column(name = "status")
    private String status;
    @Column(name = "plantilla_verificacion")
    private String plantillaVerificacion;


}

