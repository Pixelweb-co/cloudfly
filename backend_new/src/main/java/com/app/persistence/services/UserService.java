package com.app.persistence.services;

import com.app.dto.AuthRegisterRequest;
import com.app.dto.UserDto;
import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.*;
import com.app.persistence.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.reactive.ReactiveKafkaProducerTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService {

        private static final Logger log = LoggerFactory.getLogger(UserService.class);
        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final UserRoleRepository userRoleRepository;
        private final TenantService tenantService;
        private final PasswordEncoder passwordEncoder;
        private final TenantRepository tenantRepository;
        private final ReactiveKafkaProducerTemplate<String, Object> kafkaTemplate;
        private final PlanRepository planRepository;
        private final PlanModuleRepository planModuleRepository;
        private final SubscriptionRepository subscriptionRepository;
        private final SubscriptionModuleRepository subscriptionModuleRepository;
        private final CompanyRepository companyRepository;

        public UserService(UserRepository userRepository, 
                           RoleRepository roleRepository, 
                           UserRoleRepository userRoleRepository, 
                           TenantService tenantService, 
                           PasswordEncoder passwordEncoder, 
                           TenantRepository tenantRepository, 
                           ReactiveKafkaProducerTemplate<String, Object> kafkaTemplate, 
                           PlanRepository planRepository, 
                           PlanModuleRepository planModuleRepository, 
                           SubscriptionRepository subscriptionRepository, 
                           SubscriptionModuleRepository subscriptionModuleRepository, 
                           CompanyRepository companyRepository) {
                this.userRepository = userRepository;
                this.roleRepository = roleRepository;
                this.userRoleRepository = userRoleRepository;
                this.tenantService = tenantService;
                this.passwordEncoder = passwordEncoder;
                this.tenantRepository = tenantRepository;
                this.kafkaTemplate = kafkaTemplate;
                this.planRepository = planRepository;
                this.planModuleRepository = planModuleRepository;
                this.subscriptionRepository = subscriptionRepository;
                this.subscriptionModuleRepository = subscriptionModuleRepository;
                this.companyRepository = companyRepository;
        }

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
                                                                .then(handleAutomaticSubscription(finalCustId))
                                                                .then(Mono.defer(() -> {
                                                                        sendRegistrationEmail(savedUser);
                                                                        return Mono.just(savedUser);
                                                                }));
                                        });
                });
        }

        private Mono<Void> handleAutomaticSubscription(Long customerId) {
                if (customerId == null)
                        return Mono.empty();

                return planRepository.findByIsFreeTrue()
                                .next()
                                .flatMap(freePlan -> {
                                        SubscriptionEntity subscription = SubscriptionEntity.builder()
                                                        .planId(freePlan.getId())
                                                        .customerId(customerId)
                                                        .status("ACTIVE")
                                                        .billingCycle("MONTHLY")
                                                        .startDate(LocalDateTime.now())
                                                        .endDate(LocalDateTime.now()
                                                                        .plusDays(freePlan.getDurationDays() != null
                                                                                        ? freePlan.getDurationDays()
                                                                                        : 365))
                                                        .aiTokensLimit(freePlan.getAiTokensLimit())
                                                        .usersLimit(freePlan.getUsersLimit())
                                                        .monthlyPrice(BigDecimal.ZERO)
                                                        .createdAt(LocalDateTime.now())
                                                        .updatedAt(LocalDateTime.now())
                                                        .build();

                                        return subscriptionRepository.save(subscription)
                                                        .flatMap(savedSub -> planModuleRepository
                                                                        .findByPlanId(freePlan.getId())
                                                                        .flatMap(pm -> subscriptionModuleRepository.insertModule(savedSub.getId(), pm.getModuleId()))
                                                                        .then());
                                });
        }

        private void sendRegistrationEmail(UserEntity savedUser) {
                kafkaTemplate.send("register-user", Map.of(
                                "name", savedUser.getNombres(),
                                "email", savedUser.getEmail(),
                                "token", savedUser.getVerificationToken()))
                                .subscribe(
                                                result -> {
                                                },
                                                error -> log.error("Error enviando a Kafka: {}", error.getMessage()));
        }

        public Mono<UserDto> convertToDto(UserEntity user) {
                return roleRepository.findRolesByUserId(user.getId())
                                .collectList()
                                .flatMap(roles -> {
                                        if (user.getCustomerId() != null) {
                                                return Mono.zip(
                                                        tenantRepository.findById(user.getCustomerId()),
                                                        subscriptionRepository.findFirstByCustomerIdAndStatusOrderByEndDateDesc(user.getCustomerId(), "ACTIVE")
                                                                .map(s -> true)
                                                                .defaultIfEmpty(false),
                                                        companyRepository.findByTenantId(user.getCustomerId())
                                                                .filter(CompanyEntity::getIsPrincipal)
                                                                .next()
                                                                .map(CompanyEntity::getId)
                                                                .defaultIfEmpty(0L)
                                                ).map(tuple -> buildUserDto(user, roles, tuple.getT1(), (Boolean) tuple.getT2(), (Long) tuple.getT3()))
                                                .defaultIfEmpty(buildUserDto(user, roles, null, false, 0L));
                                        } else {
                                                return Mono.just(buildUserDto(user, roles, null, false, 0L));
                                        }
                                });
        }

        private UserDto buildUserDto(UserEntity user, List<RoleEntity> roles, TenantEntity tenant, boolean hasActiveSub, Long activeCompanyId) {
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
                                .activeCompanyId(activeCompanyId != 0L ? activeCompanyId : null)
                                .roles(roles)
                                .tenant(tenant)
                                .hasActiveSubscription(hasActiveSub)
                                .build();
        }

        public Mono<UserEntity> getCurrentUser() {
                return org.springframework.security.core.context.ReactiveSecurityContextHolder.getContext()
                                .map(org.springframework.security.core.context.SecurityContext::getAuthentication)
                                .flatMap(auth -> findByUsername(auth.getName()));
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

    public Mono<Void> forgotPassword(String email) {
        return userRepository.findByEmail(email)
                .flatMap(user -> {
                    user.setRecoveryToken(UUID.randomUUID().toString());
                    return userRepository.save(user)
                            .flatMap(savedUser -> {
                                String resetLink = "https://dashboard.cloudfly.com.co/reset-password/" + savedUser.getRecoveryToken();
                                return kafkaTemplate.send("email-notifications", Map.of(
                                        "to", savedUser.getEmail(),
                                        "subject", "🔐 Recuperación de Contraseña - CloudFly",
                                        "body", resetLink,
                                        "type", "recover-password",
                                        "username", savedUser.getUsername()
                                )).then();
                            });
                });
    }

    public Mono<Void> resetPassword(String token, String newPassword) {
        return userRepository.findByRecoveryToken(token)
                .switchIfEmpty(Mono.error(new RuntimeException("Token inválido o expirado.")))
                .flatMap(user -> {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    user.setRecoveryToken(null);
                    return userRepository.save(user).then();
                });
    }
}
