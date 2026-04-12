package com.app.persistence.repository;

import com.app.persistence.entity.ContactEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ContactRepository extends ReactiveCrudRepository<ContactEntity, Long> {
    Flux<ContactEntity> findByTenantId(Long tenantId);
    Flux<ContactEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);
    Mono<ContactEntity> findByTenantIdAndCompanyIdAndPhone(Long tenantId, Long companyId, String phone);
    Flux<ContactEntity> findByTenantIdAndCompanyIdAndNameContainingIgnoreCase(Long tenantId, Long companyId, String name);
    Flux<ContactEntity> findByTenantIdAndCompanyIdAndPipelineId(Long tenantId, Long companyId, Long pipelineId);
    Flux<ContactEntity> findByTenantIdAndCompanyIdAndPipelineIdAndStageId(Long tenantId, Long companyId, Long pipelineId, Long stageId);
    Mono<ContactEntity> findByTenantIdAndCompanyIdAndEmail(Long tenantId, Long companyId, String email);
    Mono<ContactEntity> findByTenantIdAndCompanyIdAndDocumentNumber(Long tenantId, Long companyId, String documentNumber);
    Mono<Boolean> existsByTenantIdAndCompanyIdAndPhone(Long tenantId, Long companyId, String phone);
}
