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
        String cleanPhone = contact.getPhone() != null ? contact.getPhone().replaceAll("[^0-9]", "") : "";
        contact.setPhone(cleanPhone);
        contact.setTenantId(tenantId);
        contact.setCompanyId(companyId);
        contact.setCreatedAt(LocalDateTime.now());
        contact.setUpdatedAt(LocalDateTime.now());
        if (contact.getStage() == null) contact.setStage("LEAD");

        return contactRepository.findByTenantIdAndCompanyIdAndPhone(tenantId, companyId, cleanPhone)
                .flatMap(existing -> Mono.<ContactEntity>error(new RuntimeException("El número de teléfono ya está registrado para otro contacto.")))
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("Creating new contact: {} for tenant: {}", contact.getName(), tenantId);
                    return contactRepository.save(contact);
                }));
    }

    public Mono<ContactEntity> update(Long id, ContactEntity contact, Long tenantId, Long companyId) {
        String cleanPhone = contact.getPhone() != null ? contact.getPhone().replaceAll("[^0-9]", "") : "";
        
        return contactRepository.findById(id)
                .filter(existing -> existing.getTenantId().equals(tenantId) && existing.getCompanyId().equals(companyId))
                .flatMap(existing -> {
                    // Si el teléfono cambió, validar que el nuevo no exista en otro contacto
                    if (existing.getPhone() != null && !existing.getPhone().equals(cleanPhone)) {
                        return contactRepository.findByTenantIdAndCompanyIdAndPhone(tenantId, companyId, cleanPhone)
                                .flatMap(other -> Mono.<ContactEntity>error(new RuntimeException("El número de teléfono ya está registrado para otro contacto.")))
                                .switchIfEmpty(Mono.defer(() -> performUpdate(existing, contact, cleanPhone)));
                    }
                    return performUpdate(existing, contact, cleanPhone);
                });
    }

    private Mono<ContactEntity> performUpdate(ContactEntity existing, ContactEntity contact, String cleanPhone) {
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
        return contactRepository.save(existing);
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
}
