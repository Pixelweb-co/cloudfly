package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.EstadoSolicitud;
import com.app.starter1.persistence.entity.TipoServicio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstadoSolicitudRepository extends JpaRepository<EstadoSolicitud, Long> {

}
