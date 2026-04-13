package com.app.persistence.repository;

import com.app.persistence.entity.CompanyEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

public interface CompanyRepository extends ReactiveCrudRepository<CompanyEntity, Long> {
    @Query("SELECT * FROM companies WHERE tenant_id = :tenantId")
    Flux<CompanyEntity> findByTenantId(Long tenantId);

    @Query("SELECT * FROM companies WHERE tenant_id = :tenantId AND is_principal = TRUE LIMIT 1")
    Mono<CompanyEntity> findFirstByTenantIdAndIsPrincipalTrue(Long tenantId);
}
