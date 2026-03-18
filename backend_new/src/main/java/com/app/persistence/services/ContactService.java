package com.app.persistence.services;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository contactRepository;

    public Mono<ContactEntity> getOrCreateContact(Long tenantId, String phone, String name) {
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        log.info("🔍 Looking for contact with phone: {} in tenant: {}", cleanPhone, tenantId);

        return contactRepository.findByTenantIdAndPhone(tenantId, cleanPhone)
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("✨ Creating new contact for phone: {}", cleanPhone);
                    ContactEntity newContact = ContactEntity.builder()
                            .tenantId(tenantId)
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
