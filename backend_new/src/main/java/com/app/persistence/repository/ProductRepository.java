package com.app.persistence.repository;

import com.app.persistence.entity.Product;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ProductRepository extends ReactiveCrudRepository<Product, Long> {
    Flux<Product> findByTenantId(Long tenantId);

    Mono<Product> findByBarcodeAndTenantId(String barcode, Long tenantId);

    Flux<Product> findByProductNameContainingIgnoreCaseAndTenantId(String query, Long tenantId);
}
