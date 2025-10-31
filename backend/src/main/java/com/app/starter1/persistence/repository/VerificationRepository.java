package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Checkeo;
import com.app.starter1.persistence.entity.PlantillaVerificacionData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationRepository extends JpaRepository<PlantillaVerificacionData, Long> {
    List<PlantillaVerificacionData> findByIdPlantilla(String idPlantilla);

}