package com.app.persistence.repository;

import org.springframework.data.r2dbc.repository.Query;
import com.app.persistence.entity.UserEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface UserRepository extends ReactiveCrudRepository<UserEntity, Long> {
    @Query("SELECT * FROM users WHERE username = :username")
    Mono<UserEntity> findByUsername(String username);

    @Query("SELECT * FROM users WHERE email = :email")
    Mono<UserEntity> findByEmail(String email);

    @Query("SELECT * FROM users WHERE verification_token = :token")
    Mono<UserEntity> findByVerificationToken(String token);
    
    @Query("SELECT * FROM users WHERE recovery_token = :token")
    Mono<UserEntity> findByRecoveryToken(String token);

    @Query("SELECT COUNT(*) > 0 FROM users WHERE username = :username")
    Mono<Boolean> existsByUsername(String username);

    @Query("SELECT COUNT(*) > 0 FROM users WHERE email = :email")
    Mono<Boolean> existsByEmail(String email);

    @org.springframework.data.r2dbc.repository.Modifying
    @Query("UPDATE users SET is_enabled = true, verification_token = NULL WHERE verification_token = :token")
    Mono<Integer> enableUserByToken(String token);
}
