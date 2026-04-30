package com.app.persistence.repository;

import com.app.persistence.entity.UserRole;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface UserRoleRepository extends ReactiveCrudRepository<UserRole, Long> {
    @Modifying
    @Query("INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)")
    Mono<Void> insertRole(Long userId, Long roleId);
}
