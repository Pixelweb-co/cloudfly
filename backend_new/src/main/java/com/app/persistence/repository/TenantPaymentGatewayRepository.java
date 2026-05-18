package com.app.persistence.repository;

import com.app.persistence.entity.TenantPaymentGatewayEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TenantPaymentGatewayRepository extends ReactiveCrudRepository<TenantPaymentGatewayEntity, Long> {
    Flux<TenantPaymentGatewayEntity> findAllByTenantId(Long tenantId);
    Flux<TenantPaymentGatewayEntity> findAllByTenantIdAndCompanyId(Long tenantId, Long companyId);
    Mono<TenantPaymentGatewayEntity> findByTenantIdAndCompanyIdAndProvider(Long tenantId, Long companyId, String provider);
}
