package com.app.persistence.repository;

import com.app.persistence.entity.CompanyEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface CompanyRepository extends ReactiveCrudRepository<CompanyEntity, Long> {
    Flux<CompanyEntity> findByTenantId(Long tenantId);
}
