package com.app.controllers;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.services.ContactService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContactController {

    private final ContactService contactService;
    private final UserService userService;

    private Mono<Long> getCurrentTenantId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    if (auth == null || auth.getName() == null) {
                        return Mono.empty();
                    }
                    return userService.findByUsername(auth.getName());
                })
                .flatMap(user -> Mono.justOrEmpty(user.getCustomerId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<ContactEntity> getAllContacts(
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long companyId) {
        
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMapMany(auth -> {
                    boolean isManager = auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().contains("MANAGER"));
                    
                    return userService.findByUsername(auth.getName())
                            .flatMapMany(user -> {
                                Long targetTenantId = (isManager && tenantId != null) ? tenantId : user.getCustomerId();
                                log.info("Fetching contacts for Tenant: {}, Company: {}", targetTenantId, companyId);
                                return contactService.findAll(targetTenantId, companyId);
                            });
                });
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<ContactEntity> getContactById(@PathVariable Long id, @RequestParam(required = false) Long companyId) {
        return getCurrentTenantId()
                .flatMap(tenantId -> contactService.findById(id, tenantId, companyId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<ContactEntity> createContact(@RequestBody ContactEntity contact, @RequestParam(required = false) Long companyId) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> userService.findByUsername(auth.getName())
                        .flatMap(user -> {
                            boolean isManager = auth.getAuthorities().stream()
                                    .anyMatch(a -> a.getAuthority().contains("MANAGER"));
                            
                            Long targetTenantId = (isManager && contact.getTenantId() != null) 
                                    ? contact.getTenantId() 
                                    : user.getCustomerId();
                                    
                            Long targetCompanyId = (companyId != null) ? companyId : contact.getCompanyId();
                            
                            return contactService.create(contact, targetTenantId, targetCompanyId);
                        })
                );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<ContactEntity> updateContact(@PathVariable Long id, @RequestBody ContactEntity contact, @RequestParam(required = false) Long companyId) {
        return getCurrentTenantId()
                .flatMap(tenantId -> {
                    Long targetCompanyId = (companyId != null) ? companyId : contact.getCompanyId();
                    return contactService.update(id, contact, tenantId, targetCompanyId);
                });
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deleteContact(@PathVariable Long id, @RequestParam(required = false) Long companyId) {
        return getCurrentTenantId()
                .flatMap(tenantId -> contactService.delete(id, tenantId, companyId));
    }
}
