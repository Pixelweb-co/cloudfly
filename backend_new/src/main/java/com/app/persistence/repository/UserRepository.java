package com.app.persistence.repository;

import com.app.persistence.entity.UserEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface UserRepository extends ReactiveCrudRepository<UserEntity, Long> {
    Mono<UserEntity> findByUsername(String username);

    Mono<UserEntity> findByEmail(String email);

    Mono<UserEntity> findByVerificationToken(String token);
    
    Mono<UserEntity> findByRecoveryToken(String token);

    Mono<Boolean> existsByUsername(String username);

    Mono<Boolean> existsByEmail(String email);

    @org.springframework.data.r2dbc.repository.Modifying
    @org.springframework.data.r2dbc.repository.Query("UPDATE users SET is_enabled = true, verification_token = NULL WHERE verification_token = :token")
    Mono<Integer> enableUserByToken(String token);
}
