package com.app.persistence.repository;

import com.app.persistence.entity.ProductCategory;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ProductCategoryRepository extends ReactiveCrudRepository<ProductCategory, Long> {
    Flux<ProductCategory> findByProductId(Long productId);
    Mono<Void> deleteByProductId(Long productId);
}
