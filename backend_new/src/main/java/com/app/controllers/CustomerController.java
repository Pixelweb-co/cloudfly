package com.app.controllers;

import com.app.dto.AccountSetupRequest;
import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.UserEntity;
import com.app.persistence.repository.TenantRepository;
import com.app.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    @PostMapping("/account-setup")
    public Mono<ResponseEntity<UserEntity>> accountSetup(@RequestBody AccountSetupRequest request) {
        log.info("Account setup request for user: {}", request.getUserId());

        return userRepository.findById(request.getUserId())
                .flatMap(user -> {
                    AccountSetupRequest.ClienteForm form = request.getForm();

                    TenantEntity tenant = TenantEntity.builder()
                            .name(form.getName())
                            .nit(form.getNit())
                            .phone(form.getPhone())
                            .email(form.getEmail())
                            .address(form.getAddress())
                            .contact(form.getContact())
                            .position(form.getPosition())
                            .type(form.getType())
                            .status(Boolean.parseBoolean(form.getStatus()))
                            .businessType(form.getBusinessType())
                            .businessDescription(form.getObjetoSocial())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return tenantRepository.save(tenant)
                            .flatMap(savedTenant -> {
                                user.setCustomerId(savedTenant.getId());
                                return userRepository.save(user);
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
