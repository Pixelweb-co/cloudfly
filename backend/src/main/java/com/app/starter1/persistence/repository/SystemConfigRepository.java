package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    /**
     * Obtener la primera (y única) configuración del sistema
     */
    Optional<SystemConfig> findFirstByOrderByIdAsc();
}
