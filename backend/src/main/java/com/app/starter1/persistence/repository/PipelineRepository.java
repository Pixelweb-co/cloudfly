package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
    List<Pipeline> findByTenantIdAndIsActiveTrueOrderByCreatedAtDesc(Long tenantId);
    Optional<Pipeline> findByIdAndTenantId(Long id, Long tenantId);
    Optional<Pipeline> findByTenantIdAndIsDefaultTrue(Long tenantId);
}
