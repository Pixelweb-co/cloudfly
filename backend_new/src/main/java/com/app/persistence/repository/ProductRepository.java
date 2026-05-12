package com.app.persistence.repository;

import com.app.persistence.entity.Product;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
    @Query("SELECT * FROM productos WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Flux<Product> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM productos WHERE barcode = :barcode AND tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Mono<Product> findByBarcodeAndTenantIdAndCompanyId(String barcode, Long tenantId, Long companyId);

    @Query("SELECT * FROM productos WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND (LOWER(product_name) LIKE LOWER(CONCAT('%', :query, '%')))")
    Flux<Product> findByProductNameContainingIgnoreCaseAndTenantIdAndCompanyId(String query, Long tenantId, Long companyId);

    @Query("SELECT * FROM productos WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND id IN (:ids)")
    Flux<Product> findByIdInAndTenantIdAndCompanyId(java.util.Collection<Long> ids, Long tenantId, Long companyId);

    @Query("SELECT COUNT(*) FROM productos WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Mono<Integer> countByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM productos WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND product_type = :productType")
    Flux<Product> findByTenantIdAndCompanyIdAndProductType(Long tenantId, Long companyId, String productType);
}
