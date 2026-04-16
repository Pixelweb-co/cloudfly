package com.app.controllers;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.repository.CompanyRepository;
import com.app.persistence.services.ContactService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContactController {

    private final ContactService contactService;
    private final CompanyRepository companyRepository;

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
                            && (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-tenant-id", headers.get("X-Tenant-Id"));
                            finalTenantId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [CONTACT-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager
                            && (headers.containsKey("x-company-id") || headers.containsKey("X-Company-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-company-id", headers.get("X-Company-Id"));
                            finalCompanyId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [CONTACT-AUTH] Invalid x-company-id header");
                        }
                    }

                    return new UserContext(finalTenantId, finalCompanyId, roles);
                });
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<ContactEntity> getAllContacts(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> {
                    if (ctx.companyId() != null) {
                        return contactService.findAll(ctx.tenantId(), ctx.companyId());
                    } else {
                        // Si no hay compañía definida (o es global), podemos buscar por principal o por
                        // tenant solo
                        return companyRepository.findFirstByTenantIdAndIsPrincipalTrue(ctx.tenantId())
                                .flatMapMany(primary -> contactService.findAll(ctx.tenantId(), primary.getId()))
                                .switchIfEmpty(contactService.findAll(ctx.tenantId(), null));
                    }
                });
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<ContactEntity> getContactById(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> contactService.findById(id, ctx.tenantId(), ctx.companyId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<ContactEntity> createContact(@RequestBody ContactEntity contact,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> contactService.create(contact, ctx.tenantId(), ctx.companyId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<ContactEntity> updateContact(@PathVariable Long id, @RequestBody ContactEntity contact,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> contactService.update(id, contact, ctx.tenantId(), ctx.companyId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deleteContact(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> contactService.delete(id, ctx.tenantId(), ctx.companyId()));
    }

    @GetMapping("/check-phone")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<Boolean> checkPhoneAvailability(@RequestParam String phone,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> contactService.existsByPhone(ctx.tenantId(), ctx.companyId(), phone));
    }

    @GetMapping("/check-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<Boolean> checkEmailAvailability(@RequestParam String email,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> contactService.existsByEmail(ctx.tenantId(), ctx.companyId(), email));
    }
}
