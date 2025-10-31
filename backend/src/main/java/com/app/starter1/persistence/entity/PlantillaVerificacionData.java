package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Data
@Builder
@AllArgsConstructor
@Table(name = "tb_verification")
@NoArgsConstructor
public class PlantillaVerificacionData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", length = 40, nullable = false)
    private Long id;

    @Column(name = "id_plantilla")
    private String idPlantilla;

    @Column(name = "optionId")
    private String optionid;
    @Column(name = "id_grupo")
    private String id_grupo;
    @Column(name = "equipment")
    private String equipment;
    @Column(name = "value")
    private String value;

}