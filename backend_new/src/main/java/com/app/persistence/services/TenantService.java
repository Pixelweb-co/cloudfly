package com.app.persistence.services;

import com.app.persistence.entity.TenantEntity;
import com.app.persistence.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

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
        return tenantRepository.save(tenant);
    }

    public Mono<TenantEntity> getById(Long id) {
        return tenantRepository.findById(id);
    }
}
