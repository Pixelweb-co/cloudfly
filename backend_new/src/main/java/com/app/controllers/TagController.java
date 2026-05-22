package com.app.controllers;

import com.app.dto.ContactTagsRequest;
import com.app.dto.TagRequest;
import com.app.persistence.entity.TagEntity;
import com.app.persistence.repository.CompanyRepository;
import com.app.persistence.services.TagService;
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
@RequestMapping("/api/v1/crm")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TagController {

    private final TagService tagService;
    private final CompanyRepository companyRepository;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return Mono.just(new UserContext(1L, null, Set.of()));
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());

                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER") || roles.contains("ROLE_SUPERADMIN");

                    Long tenantId = tokenTenantId;
                    if (isAdminOrManager && (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-tenant-id", headers.get("X-Tenant-Id"));
                            tenantId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [TAG-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    Long companyId = tokenCompanyId;
                    if (isAdminOrManager && (headers.containsKey("x-company-id") || headers.containsKey("X-Company-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-company-id", headers.get("X-Company-Id"));
                            companyId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [TAG-AUTH] Invalid x-company-id header");
                        }
                    }

                    if (companyId != null) {
                        return Mono.just(new UserContext(tenantId, companyId, roles));
                    } else {
                        Long finalTenantId = tenantId;
                        return companyRepository.findFirstByTenantIdAndIsPrincipalTrue(tenantId)
                                .map(primary -> new UserContext(finalTenantId, primary.getId(), roles))
                                .switchIfEmpty(companyRepository.findByTenantId(tenantId).next()
                                        .map(company -> new UserContext(finalTenantId, company.getId(), roles))
                                )
                                .defaultIfEmpty(new UserContext(finalTenantId, null, roles));
                    }
                });
    }

    @GetMapping("/tags")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<TagEntity> getAllTags(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> {
                    if (ctx.companyId() == null) {
                        return Flux.empty();
                    }
                    return tagService.getTagsByCompany(ctx.tenantId(), ctx.companyId());
                });
    }

    @PostMapping("/tags")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<TagEntity> createTag(@RequestBody TagRequest request, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía para crear la etiqueta."));
                    }
                    return tagService.createTag(request, ctx.tenantId(), ctx.companyId());
                });
    }

    @PutMapping("/tags/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<TagEntity> updateTag(@PathVariable Long id, @RequestBody TagRequest request, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return tagService.updateTag(id, request, ctx.tenantId(), ctx.companyId());
                });
    }

    @DeleteMapping("/tags/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deleteTag(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return tagService.deleteTag(id, ctx.tenantId(), ctx.companyId());
                });
    }

    @GetMapping("/contacts/{contactId}/tags")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<TagEntity> getTagsForContact(@PathVariable Long contactId, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> {
                    if (ctx.companyId() == null) {
                        return Flux.empty();
                    }
                    return tagService.getTagsForContact(contactId, ctx.tenantId(), ctx.companyId());
                });
    }

    @PostMapping("/contacts/{contactId}/tags")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> associateTagsToContact(@PathVariable Long contactId, @RequestBody ContactTagsRequest request, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return tagService.associateTagsToContact(contactId, request, ctx.tenantId(), ctx.companyId());
                });
    }

    @DeleteMapping("/contacts/{contactId}/tags/{tagId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> disassociateTagFromContact(@PathVariable Long contactId, @PathVariable Long tagId, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return tagService.disassociateTagFromContact(contactId, tagId, ctx.tenantId(), ctx.companyId());
                });
    }
}
