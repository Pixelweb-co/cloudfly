package com.app.persistence.repository;

import com.app.persistence.entity.RoleEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface RoleRepository extends ReactiveCrudRepository<RoleEntity, Long> {
    @Query("SELECT * FROM roles WHERE role_name = :name")
    Mono<RoleEntity> findByName(String name);

    @Query("SELECT r.* FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = :userId")
    Flux<RoleEntity> findRolesByUserId(Long userId);
}
