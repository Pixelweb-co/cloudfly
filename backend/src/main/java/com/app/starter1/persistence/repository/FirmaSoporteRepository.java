package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.FirmaSoporte;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface FirmaSoporteRepository extends JpaRepository<FirmaSoporte, Long> {

    // Método personalizado para buscar por idUsuario
    Optional<FirmaSoporte> findByIdUsuario(Long idUsuario);

    @Transactional
    @Modifying
    @Query("DELETE FROM FirmaSoporte f WHERE f.idUsuario = :idUsuario")
    void deleteByIdUsuario(Long idUsuario);
}
