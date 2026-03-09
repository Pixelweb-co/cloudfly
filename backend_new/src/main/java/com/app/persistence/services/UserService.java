package com.app.persistence.services;

import com.app.dto.AuthRegisterRequest;
import com.app.dto.UserDto;
import com.app.persistence.entity.CustomerEntity;
import com.app.persistence.entity.RoleEntity;
import com.app.persistence.entity.UserEntity;
import com.app.persistence.entity.UserRole;
import com.app.persistence.repository.CustomerRepository;
import com.app.persistence.repository.RoleRepository;
import com.app.persistence.repository.UserRepository;
import com.app.persistence.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.reactive.ReactiveKafkaProducerTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final UserRoleRepository userRoleRepository;
        private final TenantService tenantService;
        private final PasswordEncoder passwordEncoder;
        private final CustomerRepository customerRepository;
        private final ReactiveKafkaProducerTemplate<String, Object> kafkaTemplate;

        @Transactional
        public Mono<UserEntity> registerUser(AuthRegisterRequest request) {
                Mono<Long> customerIdProvider = (request.getCompanyName() != null
                                && !request.getCompanyName().trim().isEmpty())
                                                ? tenantService.createTenant(request.getCompanyName())
                                                                .map(tenant -> tenant.getId())
                                                : Mono.just(0L);

                return customerIdProvider.flatMap(custId -> {
                        Long finalCustId = (custId == 0L) ? null : custId;
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
                                        .customerId(finalCustId)
                                        .build();

                        return userRepository.save(user)
                                        .flatMap(savedUser -> {
                                                Flux<String> rolesToAssign = (request.getRoles() == null
                                                                || request.getRoles().isEmpty())
                                                                                ? Flux.just("ADMIN")
                                                                                : Flux.fromIterable(request.getRoles());

                                                return rolesToAssign
                                                                .flatMap(roleName -> roleRepository
                                                                                .findByName(roleName))
                                                                .flatMap(role -> userRoleRepository.save(new UserRole(
                                                                                savedUser.getId(), role.getId())))
                                                                .then(kafkaTemplate.send("register-user", Map.of(
                                                                                "name", savedUser.getNombres(),
                                                                                "email", savedUser.getEmail(),
                                                                                "token",
                                                                                savedUser.getVerificationToken())))
                                                                .then(Mono.just(savedUser));
                                        });
                });
        }

        public Mono<UserDto> convertToDto(UserEntity user) {
                return roleRepository.findRolesByUserId(user.getId())
                                .collectList()
                                .flatMap(roles -> {
                                        if (user.getCustomerId() != null) {
                                                return customerRepository.findById(user.getCustomerId())
                                                                .map(customer -> buildUserDto(user, roles, customer))
                                                                .defaultIfEmpty(buildUserDto(user, roles, null));
                                        } else {
                                                return Mono.just(buildUserDto(user, roles, null));
                                        }
                                });
        }

        private UserDto buildUserDto(UserEntity user, List<RoleEntity> roles, CustomerEntity customer) {
                return UserDto.builder()
                                .id(user.getId())
                                .nombres(user.getNombres())
                                .apellidos(user.getApellidos())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .isEnabled(user.isEnabled())
                                .accountNoExpired(user.isAccountNoExpired())
                                .accountNoLocked(user.isAccountNoLocked())
                                .credentialNoExpired(user.isCredentialNoExpired())
                                .verificationToken(user.getVerificationToken())
                                .recoveryToken(user.getRecoveryToken())
                                .customerId(user.getCustomerId())
                                .roles(roles)
                                .customer(customer)
                                .build();
        }

        public Mono<Boolean> verifyEmail(String token) {
                return userRepository.enableUserByToken(token)
                                .map(count -> count > 0)
                                .defaultIfEmpty(false);
        }

        public Mono<Boolean> checkUsernameAvailability(String username) {
                return userRepository.existsByUsername(username)
                                .map(exists -> !exists);
        }

        public Mono<Boolean> checkEmailAvailability(String email) {
                return userRepository.existsByEmail(email)
                                .map(exists -> !exists);
        }

        public Mono<UserEntity> findByUsername(String username) {
                return userRepository.findByUsername(username);
        }
}
