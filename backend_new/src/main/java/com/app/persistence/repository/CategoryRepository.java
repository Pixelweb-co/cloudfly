package com.app.persistence.repository;

import com.app.persistence.entity.Category;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface CategoryRepository extends ReactiveCrudRepository<Category, Long> {
    Flux<Category> findByTenantId(Long tenantId);
}
