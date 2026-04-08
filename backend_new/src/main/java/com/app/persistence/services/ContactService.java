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
        log.info("Fetching all contacts for tenant: {} and company: {}", tenantId, companyId);
        return contactRepository.findByTenantIdAndCompanyId(tenantId, companyId);
    }

    public Mono<ContactEntity> findById(Long id, Long tenantId, Long companyId) {
        return contactRepository.findById(id)
                .filter(contact -> contact.getTenantId().equals(tenantId) && contact.getCompanyId().equals(companyId));
    }

    public Mono<ContactEntity> create(ContactEntity contact, Long tenantId, Long companyId) {
        contact.setTenantId(tenantId);
        contact.setCompanyId(companyId);
        contact.setCreatedAt(LocalDateTime.now());
        contact.setUpdatedAt(LocalDateTime.now());
        if (contact.getStatus() == null) contact.setStage("LEAD"); // Default stage if not provided
        
        log.info("Creating new contact: {} for tenant: {}", contact.getName(), tenantId);
        return contactRepository.save(contact);
    }

    public Mono<ContactEntity> update(Long id, ContactEntity contact, Long tenantId, Long companyId) {
        return contactRepository.findById(id)
                .filter(existing -> existing.getTenantId().equals(tenantId) && existing.getCompanyId().equals(companyId))
                .flatMap(existing -> {
                    existing.setName(contact.getName());
                    existing.setEmail(contact.getEmail());
                    existing.setPhone(contact.getPhone());
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
                    return contactRepository.save(existing);
                });
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
                    log.info("✨ Creating new contact for phone: {}", cleanPhone);
                    ContactEntity newContact = ContactEntity.builder()
                            .tenantId(tenantId)
                            .companyId(companyId)
                            .phone(cleanPhone)
                            .name(name != null ? name : "Nuevo Contacto " + cleanPhone)
                            .type("LEAD")
                            .stage("LEAD")
                            .isActive(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return contactRepository.save(newContact);
                }));
    }
}
