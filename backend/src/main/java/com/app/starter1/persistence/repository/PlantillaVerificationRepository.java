package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PlantillaVerificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlantillaVerificationRepository extends JpaRepository<PlantillaVerificacion, Long> {

}


