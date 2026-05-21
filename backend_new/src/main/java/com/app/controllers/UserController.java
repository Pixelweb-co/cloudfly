package com.app.controllers;

import com.app.dto.UserCreateUpdateRequest;
import com.app.dto.UserDto;
import com.app.persistence.entity.UserEntity;
import com.app.persistence.repository.RoleRepository;
import com.app.persistence.repository.UserRepository;
import com.app.persistence.repository.UserRoleRepository;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {
    }

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null, Set.of());
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());

                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");

                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager
                            && (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id") || headers.containsKey("x-tenant-id".toLowerCase()))) {
                        try {
                            String headerVal = headers.get("x-tenant-id");
                            if (headerVal == null) headerVal = headers.get("X-Tenant-Id");
                            if (headerVal == null) headerVal = headers.get("x-tenant-id".toLowerCase());
                            finalTenantId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [USER-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager
                            && (headers.containsKey("x-company-id") || headers.containsKey("X-Company-Id") || headers.containsKey("x-company-id".toLowerCase()))) {
                        try {
                            String headerVal = headers.get("x-company-id");
                            if (headerVal == null) headerVal = headers.get("X-Company-Id");
                            if (headerVal == null) headerVal = headers.get("x-company-id".toLowerCase());
                            finalCompanyId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [USER-AUTH] Invalid x-company-id header");
                        }
                    }

                    return new UserContext(finalTenantId, finalCompanyId, roles);
                });
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<UserDto> getAllUsers(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> {
                    if (ctx.tenantId() == null) {
                        return Flux.empty();
                    }
                    return userRepository.findByCustomerId(ctx.tenantId())
                            .flatMap(userService::convertToDto);
                });
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<UserDto> getUserById(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> userRepository.findById(id)
                        .filter(user -> ctx.roles().contains("ROLE_SUPERADMIN") || ctx.roles().contains("ROLE_MANAGER") || ctx.tenantId().equals(user.getCustomerId()))
                        .flatMap(userService::convertToDto));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<UserDto> createUser(@RequestBody UserCreateUpdateRequest request, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    String encryptedPassword = passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "CloudFly2026*");
                    UserEntity user = UserEntity.builder()
                            .nombres(request.getNombres())
                            .apellidos(request.getApellidos())
                            .username(request.getUsername())
                            .password(encryptedPassword)
                            .email(request.getEmail())
                            .isEnabled(true)
                            .accountNoExpired(true)
                            .accountNoLocked(true)
                            .credentialNoExpired(true)
                            .customerId(ctx.tenantId())
                            .companyId(ctx.companyId())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return userRepository.save(user)
                            .flatMap(savedUser -> {
                                String roleName = request.getRole() != null ? request.getRole() : "USER";
                                return roleRepository.findByName(roleName)
                                        .flatMap(role -> userRoleRepository.insertRole(savedUser.getId(), role.getId()))
                                        .then(userService.convertToDto(savedUser));
                            });
                });
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<UserDto> updateUser(@PathVariable Long id, @RequestBody UserCreateUpdateRequest request, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> userRepository.findById(id)
                        .filter(existing -> ctx.roles().contains("ROLE_SUPERADMIN") || ctx.roles().contains("ROLE_MANAGER") || ctx.tenantId().equals(existing.getCustomerId()))
                        .flatMap(existing -> {
                            existing.setNombres(request.getNombres());
                            existing.setApellidos(request.getApellidos());
                            existing.setUsername(request.getUsername());
                            existing.setEmail(request.getEmail());
                            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                                existing.setPassword(passwordEncoder.encode(request.getPassword()));
                            }
                            existing.setUpdatedAt(LocalDateTime.now());

                            Mono<UserEntity> saveMono = userRepository.save(existing);

                            if (request.getRole() != null) {
                                return userRoleRepository.deleteRolesByUserId(existing.getId())
                                        .then(roleRepository.findByName(request.getRole()))
                                        .flatMap(role -> userRoleRepository.insertRole(existing.getId(), role.getId()))
                                        .then(saveMono)
                                        .flatMap(userService::convertToDto);
                            }

                            return saveMono.flatMap(userService::convertToDto);
                        }));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deleteUser(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> userRepository.findById(id)
                        .filter(existing -> ctx.roles().contains("ROLE_SUPERADMIN") || ctx.roles().contains("ROLE_MANAGER") || ctx.tenantId().equals(existing.getCustomerId()))
                        .flatMap(existing -> {
                            // Prevenir auto-eliminación
                            return ReactiveSecurityContextHolder.getContext()
                                    .map(SecurityContext::getAuthentication)
                                    .flatMap(auth -> {
                                        if (auth.getName().equals(existing.getUsername())) {
                                            return Mono.error(new RuntimeException("No puedes eliminar a tu propio usuario."));
                                        }
                                        return userRoleRepository.deleteRolesByUserId(existing.getId())
                                                .then(userRepository.delete(existing));
                                    });
                        }));
    }
}
