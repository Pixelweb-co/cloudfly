package com.app.persistence.repository;

import org.springframework.data.r2dbc.repository.Query;
import com.app.persistence.entity.Category;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CategoryRepository extends ReactiveCrudRepository<Category, Long> {
    @Query("SELECT * FROM categorias WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Flux<Category> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM categorias WHERE name = :categoryName AND tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Mono<Category> findByCategoryNameAndTenantIdAndCompanyId(String categoryName, Long tenantId, Long companyId);
}
