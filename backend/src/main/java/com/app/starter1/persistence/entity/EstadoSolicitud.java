package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "estado_solicitud")
@Data
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EstadoSolicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_estado_sol")
    private Long id;

    @Column(name = "desc_estado_sol")
    private String descripcion;
}