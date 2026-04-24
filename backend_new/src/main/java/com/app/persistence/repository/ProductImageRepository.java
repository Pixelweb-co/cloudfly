package com.app.persistence.repository;

import com.app.persistence.entity.ProductImage;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ProductImageRepository extends ReactiveCrudRepository<ProductImage, Long> {
    Flux<ProductImage> findByProductId(Long productId);
    Mono<Void> deleteByProductId(Long productId);
}
