package com.app.persistence.services;

import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.CompanyEntity;
import com.app.persistence.repository.TenantRepository;
import com.app.persistence.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final CompanyRepository companyRepository;

    public Mono<TenantEntity> createTenant(String name) {
        TenantEntity tenant = TenantEntity.builder()
                .name(name)
                .status(true)
                .businessType("MIXTO")
                .esEmisorFE(false)
                .esEmisorPrincipal(false)
                .isMasterTenant(false)
                .createdAt(LocalDateTime.now())
                .build();
        return tenantRepository.save(tenant)
                .flatMap(savedTenant -> {
                    CompanyEntity defaultCompany = CompanyEntity.builder()
                            .tenantId(savedTenant.getId())
                            .name(name + " (Default)")
                            .status(true)
                            .isPrincipal(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return companyRepository.save(defaultCompany)
                            .thenReturn(savedTenant);
                });
    }

    public Mono<TenantEntity> getById(Long id) {
        return tenantRepository.findById(id);
    }
}
