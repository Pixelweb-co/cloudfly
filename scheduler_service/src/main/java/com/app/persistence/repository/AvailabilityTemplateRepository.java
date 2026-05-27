package com.app.persistence.repository;

import com.app.persistence.entity.AvailabilityTemplateEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface AvailabilityTemplateRepository extends ReactiveCrudRepository<AvailabilityTemplateEntity, Long> {
    Flux<AvailabilityTemplateEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);
    Flux<AvailabilityTemplateEntity> findByTenantIdAndCompanyIdAndUserId(Long tenantId, Long companyId, Long userId);
}
