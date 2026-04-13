package com.app.persistence.repository;

import com.app.persistence.entity.Product;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
    @Query("SELECT * FROM productos WHERE tenant_id = :tenantId")
    Flux<Product> findByTenantId(Long tenantId);

    @Query("SELECT * FROM productos WHERE barcode = :barcode AND tenant_id = :tenantId")
    Mono<Product> findByBarcodeAndTenantId(String barcode, Long tenantId);

    @Query("SELECT * FROM productos WHERE tenant_id = :tenantId AND (LOWER(product_name) LIKE LOWER(CONCAT('%', :query, '%')))")
    Flux<Product> findByProductNameContainingIgnoreCaseAndTenantId(String query, Long tenantId);

    @Query("SELECT * FROM productos WHERE tenant_id = :tenantId AND id IN (:ids)")
    Flux<Product> findByIdInAndTenantId(java.util.Collection<Long> ids, Long tenantId);

    @Query("SELECT COUNT(*) FROM productos WHERE tenant_id = :tenantId")
    Mono<Long> countByTenantId(Long tenantId);
}
