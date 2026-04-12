package com.app.persistence.services;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository contactRepository;

    public Flux<ContactEntity> findAll(Long tenantId, Long companyId) {
        if (companyId != null) {
            log.info("Fetching all contacts for tenant: {} and company: {}", tenantId, companyId);
            return contactRepository.findByTenantIdAndCompanyId(tenantId, companyId);
        } else {
            log.info("Fetching all contacts for tenant: {} (Broad search)", tenantId);
            return contactRepository.findByTenantId(tenantId);
        }
    }

    public Mono<ContactEntity> findById(Long id, Long tenantId, Long companyId) {
        return contactRepository.findById(id)
                .filter(contact -> contact.getTenantId().equals(tenantId) && contact.getCompanyId().equals(companyId));
    }

    public Mono<ContactEntity> create(ContactEntity contact, Long tenantId, Long companyId) {
        String cleanPhone = contact.getPhone() != null ? contact.getPhone().replaceAll("[^0-9]", "") : "";
        contact.setPhone(cleanPhone);
        contact.setTenantId(tenantId);
        contact.setCompanyId(companyId);
        contact.setUuid(java.util.UUID.randomUUID().toString());
        contact.setCreatedAt(LocalDateTime.now());
        contact.setUpdatedAt(LocalDateTime.now());
        if (contact.getStage() == null) contact.setStage("LEAD");

        return validateContactUniqueness(contact, tenantId, companyId)
                .then(Mono.defer(() -> {
                    log.info("Creating new contact: {} for tenant: {}", contact.getName(), tenantId);
                    return contactRepository.save(contact);
                }));
    }

    private Mono<Void> validateContactUniqueness(ContactEntity contact, Long tenantId, Long companyId) {
        Mono<Void> phoneCheck = contactRepository.findByTenantIdAndCompanyIdAndPhone(tenantId, companyId, contact.getPhone())
                .flatMap(existing -> Mono.error(new RuntimeException("El número de teléfono ya está registrado.")));
        
        Mono<Void> emailCheck = (contact.getEmail() != null && !contact.getEmail().isEmpty())
                ? contactRepository.findByTenantIdAndCompanyIdAndEmail(tenantId, companyId, contact.getEmail())
                        .flatMap(existing -> Mono.error(new RuntimeException("El correo electrónico ya está registrado.")))
                : Mono.empty();
        
        Mono<Void> docCheck = (contact.getDocumentNumber() != null && !contact.getDocumentNumber().isEmpty())
                ? contactRepository.findByTenantIdAndCompanyIdAndDocumentNumber(tenantId, companyId, contact.getDocumentNumber())
                        .flatMap(existing -> Mono.error(new RuntimeException("El número de documento ya está registrado.")))
                : Mono.empty();

        return Mono.when(phoneCheck, emailCheck, docCheck);
    }

    public Mono<ContactEntity> update(Long id, ContactEntity contact, Long tenantId, Long companyId) {
        String cleanPhone = contact.getPhone() != null ? contact.getPhone().replaceAll("[^0-9]", "") : "";
        
        return contactRepository.findById(id)
                .filter(existing -> existing.getTenantId().equals(tenantId) && existing.getCompanyId().equals(companyId))
                .flatMap(existing -> {
                    // Validar unicidad si los campos cambiaron
                    Mono<Void> validation = Mono.empty();
                    
                    if (!existing.getPhone().equals(cleanPhone)) {
                        validation = validation.then(contactRepository.findByTenantIdAndCompanyIdAndPhone(tenantId, companyId, cleanPhone)
                                .flatMap(other -> Mono.error(new RuntimeException("El número de teléfono ya está registrado en otro contacto."))));
                    }
                    
                    if (contact.getEmail() != null && !contact.getEmail().equals(existing.getEmail())) {
                        validation = validation.then(contactRepository.findByTenantIdAndCompanyIdAndEmail(tenantId, companyId, contact.getEmail())
                                .flatMap(other -> Mono.error(new RuntimeException("El correo electrónico ya está registrado en otro contacto."))));
                    }

                    if (contact.getDocumentNumber() != null && !contact.getDocumentNumber().equals(existing.getDocumentNumber())) {
                        validation = validation.then(contactRepository.findByTenantIdAndCompanyIdAndDocumentNumber(tenantId, companyId, contact.getDocumentNumber())
                                .flatMap(other -> Mono.error(new RuntimeException("El número de documento ya está registrado en otro contacto."))));
                    }

                    return validation.then(Mono.defer(() -> performUpdate(existing, contact, cleanPhone)));
                });
    }

    private Mono<ContactEntity> performUpdate(ContactEntity existing, ContactEntity contact, String cleanPhone) {
        log.info("Updating Contact ID: {}. Name: {}, PipelineID: {}, StageID: {}, StageName: {}", 
                existing.getId(), contact.getName(), contact.getPipelineId(), contact.getStageId(), contact.getStage());
        
        existing.setName(contact.getName());
        existing.setEmail(contact.getEmail());
        existing.setPhone(cleanPhone);
        existing.setAddress(contact.getAddress());
        existing.setTaxId(contact.getTaxId());
        existing.setType(contact.getType());
        existing.setStage(contact.getStage());
        existing.setPipelineId(contact.getPipelineId());
        existing.setStageId(contact.getStageId());
        existing.setDocumentType(contact.getDocumentType());
        existing.setDocumentNumber(contact.getDocumentNumber());
        existing.setActive(contact.isActive());
        existing.setUpdatedAt(LocalDateTime.now());
        
        return contactRepository.save(existing)
                .doOnSuccess(saved -> log.info("Successfully saved Contact ID: {}. Persisted PipelineID: {}, StageID: {}", 
                        saved.getId(), saved.getPipelineId(), saved.getStageId()));
    }

    public Mono<Void> delete(Long id, Long tenantId, Long companyId) {
        return contactRepository.findById(id)
                .filter(existing -> existing.getTenantId().equals(tenantId) && existing.getCompanyId().equals(companyId))
                .flatMap(contactRepository::delete);
    }

    public Mono<ContactEntity> getOrCreateContact(Long tenantId, Long companyId, String phone, String name) {
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        log.info("🔍 Looking for contact with phone: {} in tenant: {} and company: {}", cleanPhone, tenantId, companyId);

        return contactRepository.findByTenantIdAndCompanyIdAndPhone(tenantId, companyId, cleanPhone)
                .switchIfEmpty(Mono.defer(() -> {
                    String contactName = (name != null && !name.trim().isEmpty()) 
                            ? name + " (" + cleanPhone + ")"
                            : "Nuevo Contacto " + cleanPhone;
                            
                    ContactEntity newContact = ContactEntity.builder()
                            .uuid(java.util.UUID.randomUUID().toString())
                            .tenantId(tenantId)
                            .companyId(companyId)
                            .phone(cleanPhone)
                            .name(contactName)
                            .type("LEAD")
                            .stage("LEAD")
                            .isActive(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return contactRepository.save(newContact);
                }));
    }

    public Mono<Boolean> existsByPhone(Long tenantId, Long companyId, String phone) {
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        return contactRepository.existsByTenantIdAndCompanyIdAndPhone(tenantId, companyId, cleanPhone);
    }
}
