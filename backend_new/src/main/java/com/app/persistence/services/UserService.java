package com.app.persistence.services;

import com.app.dto.AuthRegisterRequest;
import com.app.persistence.entity.UserEntity;
import com.app.persistence.entity.UserRole;
import com.app.persistence.repository.RoleRepository;
import com.app.persistence.repository.UserRepository;
import com.app.persistence.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final UserRoleRepository userRoleRepository;
        private final TenantService tenantService;
        private final PasswordEncoder passwordEncoder;

        @Transactional
        public Mono<UserEntity> registerUser(AuthRegisterRequest request) {
                return tenantService.createTenant(request.getCompanyName())
                                .flatMap(tenant -> {
                                        UserEntity user = UserEntity.builder()
                                                        .nombres(request.getNombres())
                                                        .apellidos(request.getApellidos())
                                                        .username(request.getUsername())
                                                        .password(passwordEncoder.encode(request.getPassword()))
                                                        .email(request.getEmail())
                                                        .isEnabled(false)
                                                        .accountNoExpired(true)
                                                        .accountNoLocked(true)
                                                        .credentialNoExpired(true)
                                                        .verificationToken(UUID.randomUUID().toString())
                                                        .customerId(tenant.getId())
                                                        .build();

                                        return userRepository.save(user)
                                                        .flatMap(savedUser -> {
                                                                // Por defecto asignamos el rol USER o el que venga en
                                                                // el request
                                                                Flux<String> rolesToAssign = (request.getRoles() == null
                                                                                || request.getRoles().isEmpty())
                                                                                                ? Flux.just("ADMIN")
                                                                                                : Flux.fromIterable(
                                                                                                                request.getRoles());

                                                                return rolesToAssign
                                                                                .flatMap(roleName -> roleRepository
                                                                                                .findByName(roleName))
                                                                                .flatMap(role -> userRoleRepository
                                                                                                .save(new UserRole(
                                                                                                                savedUser.getId(),
                                                                                                                role.getId())))
                                                                                .then(Mono.just(savedUser));
                                                        });
                                });
        }

        public Mono<Boolean> verifyEmail(String token) {
                return userRepository.findByVerificationToken(token)
                                .flatMap(user -> {
                                        user.setEnabled(true);
                                        user.setVerificationToken(null); // Limpiar el token tras uso
                                        return userRepository.save(user).thenReturn(true);
                                })
                                .defaultIfEmpty(false);
        }
}
