package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "solicitudes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud")
    private Long idSolicitud;

    @Column(name = "fecha", length = 12)
    private String fecha;

    @Column(name = "hora", length = 10)
    private String hora;

    @Column(name = "description", length = 10)
    private String description;

    @ManyToOne
    @JoinColumn(name = "id_equipo", referencedColumnName = "id_producto")
    private Product equipo;


    @Column(name = "id_tipo_servicio", insertable = false, updatable = false)
    private Long idTipoServicio;

    @ManyToOne
    @JoinColumn(name = "id_usuario_asignado", referencedColumnName = "id")
    private UserEntity usuarioAsignado;

    @ManyToOne
    @JoinColumn(name = "id_tipo_servicio", referencedColumnName = "id_tipo_servicio")
    private TipoServicio typeService;

    @ManyToOne
    @JoinColumn(name = "status", referencedColumnName = "id_estado_sol")
    private EstadoSolicitud status;

    @ManyToOne
    @JoinColumn(name = "id_entidad", referencedColumnName = "id")
    private Customer customer;

}
