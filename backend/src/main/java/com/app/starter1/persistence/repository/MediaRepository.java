package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaRepository extends JpaRepository<Media, Long> {

    List<Media> findByTenantId(Long tenantId);

}
