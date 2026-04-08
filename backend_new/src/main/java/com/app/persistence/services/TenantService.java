package com.app.persistence.services;

import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.CompanyEntity;
import com.app.persistence.entity.PipelineEntity;
import com.app.persistence.entity.PipelineStageEntity;
import com.app.persistence.repository.TenantRepository;
import com.app.persistence.repository.CompanyRepository;
import com.app.persistence.repository.PipelineRepository;
import com.app.persistence.repository.PipelineStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final CompanyRepository companyRepository;
    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository pipelineStageRepository;

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
                            .flatMap(savedCompany -> createDefaultPipeline(savedTenant.getId(), savedCompany.getId()))
                            .thenReturn(savedTenant);
                });
    }

    private Mono<Void> createDefaultPipeline(Long tenantId, Long companyId) {
        PipelineEntity defaultPipeline = PipelineEntity.builder()
                .tenantId(tenantId)
                .companyId(companyId)
                .name("Pipeline General")
                .description("Embudo por defecto creado automáticamente")
                .type("SALES")
                .color("#7367F0")
                .isActive(true)
                .isDefault(true)
                .createdAt(LocalDateTime.now())
                .build();

        return pipelineRepository.save(defaultPipeline)
                .flatMap(pipeline -> {
                    PipelineStageEntity s1 = createStage(pipeline.getId(), "Contacto Inicial", "#3B82F6", 0, true, false, "OPEN");
                    PipelineStageEntity s2 = createStage(pipeline.getId(), "En Negociación", "#EAB308", 1, false, false, "OPEN");
                    PipelineStageEntity s3 = createStage(pipeline.getId(), "Ganado", "#22C55E", 2, false, true, "WON");
                    
                    return pipelineStageRepository.save(s1)
                            .then(pipelineStageRepository.save(s2))
                            .then(pipelineStageRepository.save(s3))
                            .then();
                });
    }

    private PipelineStageEntity createStage(Long pipelineId, String name, String color, int position, boolean isInitial, boolean isFinal, String outcome) {
        return PipelineStageEntity.builder()
                .pipelineId(pipelineId)
                .name(name)
                .color(color)
                .position(position)
                .isInitial(isInitial)
                .isFinal(isFinal)
                .outcome(outcome)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public Mono<TenantEntity> getById(Long id) {
        return tenantRepository.findById(id);
    }
}

