package com.app.persistence.repository;

import com.app.persistence.entity.QuoteEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface QuoteRepository extends ReactiveCrudRepository<QuoteEntity, Long> {
    @Query("SELECT * FROM quotes WHERE tenant_id = :tenantId")
    Flux<QuoteEntity> findAllByTenantId(Long tenantId);
    Flux<QuoteEntity> findAllByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM quotes WHERE quote_number = :quoteNumber AND tenant_id = :tenantId")
    Mono<QuoteEntity> findByQuoteNumberAndTenantId(String quoteNumber, Long tenantId);

    @Query("SELECT * FROM quotes WHERE customer_id = :customerId AND tenant_id = :tenantId")
    Flux<QuoteEntity> findByCustomerIdAndTenantId(Long customerId, Long tenantId);

    @Query("SELECT COUNT(*) FROM quotes WHERE tenant_id = :tenantId")
    Mono<Long> countByTenantId(Long tenantId);
}
