package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.TypeDevice;
import org.springframework.data.jpa.repository.JpaRepository;


public interface TypeDeviceRepository extends JpaRepository<TypeDevice, Long> {
    }