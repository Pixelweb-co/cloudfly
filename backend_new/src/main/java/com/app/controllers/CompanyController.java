package com.app.controllers;

import com.app.persistence.entity.CompanyEntity;
import com.app.persistence.repository.CompanyRepository;
import com.app.persistence.services.UserService;
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
    private final UserService userService;    @GetMapping
    public Flux<CompanyEntity> getAllCompanies(
            @RequestParam(required = false) Long tenantId,
            Authentication authentication) {
        
        if (tenantId != null && hasManagerRole(authentication)) {
            return companyRepository.findByTenantId(tenantId);
        }

        return userService.findByUsername(authentication.getName())
                .flatMapMany(user -> {
                    if (user.getCustomerId() == null) return Flux.empty();
                    return companyRepository.findByTenantId(user.getCustomerId());
                });
    }

    private boolean hasManagerRole(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("MANAGER"));
    }

    @GetMapping("/{id}")
    public Mono<CompanyEntity> getCompanyById(@PathVariable Long id, Authentication authentication) {
        return userService.findByUsername(authentication.getName())
                .flatMap(user -> companyRepository.findById(id)
                        .filter(company -> company.getTenantId().equals(user.getCustomerId())));
    }

    @PostMapping
    public Mono<CompanyEntity> createCompany(@RequestBody CompanyEntity company, Authentication authentication) {
        return userService.findByUsername(authentication.getName())
                .flatMap(user -> {
                    company.setTenantId(user.getCustomerId());
                    company.setCreatedAt(LocalDateTime.now());
                    company.setUpdatedAt(LocalDateTime.now());
                    if (company.getStatus() == null) company.setStatus(true);
                    
                    return companyRepository.findByTenantId(user.getCustomerId())
                            .count()
                            .flatMap(count -> {
                                if (count == 0) company.setIsPrincipal(true);
                                else if (company.getIsPrincipal() == null) company.setIsPrincipal(false);
                                return companyRepository.save(company);
                            });
                });
    }

    @PutMapping("/{id}")
    public Mono<CompanyEntity> updateCompany(@PathVariable Long id, @RequestBody CompanyEntity company, Authentication authentication) {
        return userService.findByUsername(authentication.getName())
                .flatMap(user -> companyRepository.findById(id)
                        .filter(existing -> existing.getTenantId().equals(user.getCustomerId()))
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
                        }));
    }

    @DeleteMapping("/{id}")
    public Mono<Void> deleteCompany(@PathVariable Long id, Authentication authentication) {
        return userService.findByUsername(authentication.getName())
                .flatMap(user -> companyRepository.findById(id)
                        .filter(existing -> existing.getTenantId().equals(user.getCustomerId()))
                        .flatMap(companyRepository::delete));
    }
}
