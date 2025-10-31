package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.FirmaSolicitud;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface FirmaSolicitudRepository extends JpaRepository<FirmaSolicitud, Long> {

    // Método personalizado para buscar por idSolicitud
    Optional<FirmaSolicitud> findByIdSolicitud(Long idSolicitud);

    @Transactional
    @Modifying
    @Query("DELETE FROM FirmaSolicitud f WHERE f.idSolicitud = :idSolicitud")
    void deleteByIdSolicitud(Long idSolicitud);
}
