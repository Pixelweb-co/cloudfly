package com.app.persistence.repository;

import com.app.persistence.entity.SendingListEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SendingListRepository extends ReactiveCrudRepository<SendingListEntity, Long> {
    @Query("SELECT * FROM sending_lists WHERE tenant_id = :tenantId AND company_id = :companyId")
    Flux<SendingListEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM sending_lists WHERE tenant_id = :tenantId AND company_id = :companyId AND status = :status")
    Flux<SendingListEntity> findByTenantIdAndCompanyIdAndStatus(Long tenantId, Long companyId, String status);

    @Query("SELECT * FROM sending_lists WHERE id = :id AND tenant_id = :tenantId AND company_id = :companyId")
    Mono<SendingListEntity> findByIdAndTenantIdAndCompanyId(Long id, Long tenantId, Long companyId);
}
