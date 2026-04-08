package com.app.controllers;

import com.app.persistence.entity.CompanyEntity;
import com.app.persistence.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompanyController {

    private final CompanyRepository companyRepository;

    @GetMapping
    public Flux<CompanyEntity> getAllCompanies(
            @RequestParam(required = false) Long tenantId,
            Authentication authentication) {
        
        // If tenantId is provided and user is MANAGER, allow it.
        // Otherwise, use the authenticated user's tenantId.
        if (tenantId != null && hasManagerRole(authentication)) {
            return companyRepository.findByTenantId(tenantId);
        }

        Long authTenantId = getTenantIdFromAuth(authentication);
        return companyRepository.findByTenantId(authTenantId);
    }

    private boolean hasManagerRole(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("MANAGER"));
    }

    @GetMapping("/{id}")
    public Mono<CompanyEntity> getCompanyById(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantIdFromAuth(authentication);
        return companyRepository.findById(id)
                .filter(company -> company.getTenantId().equals(tenantId));
    }

    @PostMapping
    public Mono<CompanyEntity> createCompany(@RequestBody CompanyEntity company, Authentication authentication) {
        Long tenantId = getTenantIdFromAuth(authentication);
        company.setTenantId(tenantId);
        company.setCreatedAt(LocalDateTime.now());
        company.setUpdatedAt(LocalDateTime.now());
        if (company.getStatus() == null) company.setStatus(true);
        if (company.getIsPrincipal() == null) company.setIsPrincipal(false);
        return companyRepository.save(company);
    }

    @PutMapping("/{id}")
    public Mono<CompanyEntity> updateCompany(@PathVariable Long id, @RequestBody CompanyEntity company, Authentication authentication) {
        Long tenantId = getTenantIdFromAuth(authentication);
        return companyRepository.findById(id)
                .filter(existing -> existing.getTenantId().equals(tenantId))
                .flatMap(existing -> {
                    existing.setName(company.getName());
                    existing.setNit(company.getNit());
                    existing.setAddress(company.getAddress());
                    existing.setPhone(company.getPhone());
                    existing.setLogoUrl(company.getLogoUrl());
                    existing.setStatus(company.getStatus());
                    existing.setIsPrincipal(company.getIsPrincipal());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return companyRepository.save(existing);
                });
    }

    @DeleteMapping("/{id}")
    public Mono<Void> deleteCompany(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantIdFromAuth(authentication);
        return companyRepository.findById(id)
                .filter(existing -> existing.getTenantId().equals(tenantId))
                .flatMap(companyRepository::delete);
    }

    private Long getTenantIdFromAuth(Authentication authentication) {
        // Implementación simplificada para este contexto
        // En una implementación real, se extraería del JWT Claims
        if (authentication == null) return 1L; // Fallback para desarrollo/test
        
        @SuppressWarnings("unchecked")
        Map<String, Object> attributes = (Map<String, Object>) authentication.getCredentials();
        if (attributes != null && attributes.containsKey("customer_id")) {
             return Long.valueOf(attributes.get("customer_id").toString());
        }
        
        return 1L; // Default tenant
    }
}
