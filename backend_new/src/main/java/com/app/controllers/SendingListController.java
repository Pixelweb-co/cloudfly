package com.app.controllers;

import com.app.persistence.entity.SendingListEntity;
import com.app.persistence.services.SendingListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequestMapping("/api/v1/marketing/lists")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SendingListController {

    private final SendingListService sendingListService;

    private record UserContext(Long tenantId, Long companyId) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null);
                    }
                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());
                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");

                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager && headers.containsKey("x-tenant-id")) {
                        finalTenantId = Long.parseLong(headers.get("x-tenant-id"));
                    }
                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager && headers.containsKey("x-company-id")) {
                        finalCompanyId = Long.parseLong(headers.get("x-company-id"));
                    }

                    return new UserContext(finalTenantId, finalCompanyId);
                });
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Flux<SendingListEntity> getAll(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> sendingListService.findAll(ctx.tenantId(), ctx.companyId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<SendingListEntity> getById(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> sendingListService.findById(id, ctx.tenantId(), ctx.companyId()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<SendingListEntity> create(@RequestBody SendingListEntity list, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> sendingListService.create(list, ctx.tenantId(), ctx.companyId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<SendingListEntity> update(@PathVariable Long id, @RequestBody SendingListEntity list, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> sendingListService.update(id, list, ctx.tenantId(), ctx.companyId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<Void> delete(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> sendingListService.delete(id, ctx.tenantId(), ctx.companyId()));
    }

    @PostMapping("/{listId}/contacts/{contactId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<Void> addContact(@PathVariable Long listId, @PathVariable Long contactId, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> sendingListService.addContactToList(listId, contactId, ctx.tenantId(), ctx.companyId()));
    }

    @DeleteMapping("/{listId}/contacts/{contactId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<Void> removeContact(@PathVariable Long listId, @PathVariable Long contactId, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> sendingListService.removeContactFromList(listId, contactId, ctx.tenantId(), ctx.companyId()));
    }
}
