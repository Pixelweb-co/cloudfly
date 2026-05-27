package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.UserEntity;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface UserRepository extends CrudRepository<UserEntity,Long> {
    Optional<UserEntity> findUserEntityByUsername(String username);
    Optional<UserEntity> findByVerificationToken(String token);
    Optional<UserEntity> findUserEntityByEmail(String email);
    boolean existsByUsername(String username); // Verifica si el username ya existe
    boolean existsByEmail(String email);       // Verifica si el email ya existe
    Optional<UserEntity> findByRecoveryToken(String token);
    Optional<UserEntity> findByUsername(String username);
}
