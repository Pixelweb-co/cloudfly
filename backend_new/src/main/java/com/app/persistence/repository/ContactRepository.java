package com.app.persistence.repository;

import com.app.persistence.entity.ContactEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ContactRepository extends ReactiveCrudRepository<ContactEntity, Long> {
    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId")
    Flux<ContactEntity> findByTenantId(Long tenantId);

    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId")
    Flux<ContactEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId AND phone = :phone")
    Mono<ContactEntity> findByTenantIdAndCompanyIdAndPhone(Long tenantId, Long companyId, String phone);

    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId AND LOWER(name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Flux<ContactEntity> findByTenantIdAndCompanyIdAndNameContainingIgnoreCase(Long tenantId, Long companyId, String name);

    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId AND pipeline_id = :pipelineId")
    Flux<ContactEntity> findByTenantIdAndCompanyIdAndPipelineId(Long tenantId, Long companyId, Long pipelineId);

    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId AND pipeline_id = :pipelineId AND stage_id = :stageId")
    Flux<ContactEntity> findByTenantIdAndCompanyIdAndPipelineIdAndStageId(Long tenantId, Long companyId, Long pipelineId, Long stageId);

    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId AND email = :email")
    Mono<ContactEntity> findByTenantIdAndCompanyIdAndEmail(Long tenantId, Long companyId, String email);

    @Query("SELECT * FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId AND document_number = :documentNumber")
    Mono<ContactEntity> findByTenantIdAndCompanyIdAndDocumentNumber(Long tenantId, Long companyId, String documentNumber);

    @Query("SELECT COUNT(*) > 0 FROM contacts WHERE tenant_id = :tenantId AND company_id = :companyId AND phone = :phone")
    Mono<Boolean> existsByTenantIdAndCompanyIdAndPhone(Long tenantId, Long companyId, String phone);
}
