package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_checkeo")
@Data
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Checkeo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "id_orden")
    private Long idOrden;

    @Column(name = "id_plantilla", length = 90)
    private String idPlantilla;

    @Column(name = "nombre", length = 140)
    private String nombre;

    @Column(name = "valor", length = 20)
    private String valor;

    @Column(name = "date_time", length = 30)
    private String dateTime;
}
