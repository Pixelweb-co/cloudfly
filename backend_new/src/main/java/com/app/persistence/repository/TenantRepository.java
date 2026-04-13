package com.app.persistence.repository;

import org.springframework.data.r2dbc.repository.Query;
import com.app.persistence.entity.TenantEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface TenantRepository extends ReactiveCrudRepository<TenantEntity, Long> {
    @Query("SELECT * FROM clientes WHERE nombre_cliente = :name")
    Mono<TenantEntity> findByName(String name);
}
