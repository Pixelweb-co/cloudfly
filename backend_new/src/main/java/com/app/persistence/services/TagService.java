package com.app.persistence.services;

import com.app.dto.ContactTagsRequest;
import com.app.dto.TagRequest;
import com.app.persistence.entity.TagEntity;
import com.app.persistence.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagService {

    private final TagRepository tagRepository;
    private final ContactService contactService;

    public Flux<TagEntity> getTagsByCompany(Long tenantId, Long companyId) {
        log.info("Fetching all tags for tenant: {} and company: {}", tenantId, companyId);
        return tagRepository.findByTenantIdAndCompanyId(tenantId, companyId);
    }

    public Mono<TagEntity> getTagById(Long id, Long tenantId, Long companyId) {
        return tagRepository.findById(id)
                .filter(tag -> tag.getTenantId().equals(tenantId) && tag.getCompanyId().equals(companyId))
                .switchIfEmpty(Mono.error(new RuntimeException("Etiqueta no encontrada o no pertenece a esta compañía.")));
    }

    public Mono<TagEntity> createTag(TagRequest request, Long tenantId, Long companyId) {
        log.info("Creating tag: {} for tenant: {}, company: {}", request.getName(), tenantId, companyId);
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            return Mono.error(new RuntimeException("El nombre de la etiqueta no puede estar vacío."));
        }
        
        String color = request.getColor() != null && !request.getColor().trim().isEmpty() 
                ? request.getColor().trim() : "#7367F0";

        return tagRepository.findByTenantIdAndCompanyIdAndName(tenantId, companyId, name)
                .flatMap(existing -> Mono.<TagEntity>error(new RuntimeException("Ya existe una etiqueta con este nombre en la compañía.")))
                .switchIfEmpty(Mono.defer(() -> {
                    TagEntity tag = TagEntity.builder()
                            .tenantId(tenantId)
                            .companyId(companyId)
                            .name(name)
                            .color(color)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return tagRepository.save(tag);
                }));
    }

    public Mono<TagEntity> updateTag(Long id, TagRequest request, Long tenantId, Long companyId) {
        log.info("Updating tag ID: {} for tenant: {}, company: {}", id, tenantId, companyId);
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            return Mono.error(new RuntimeException("El nombre de la etiqueta no puede estar vacío."));
        }

        return getTagById(id, tenantId, companyId)
                .flatMap(existing -> {
                    if (!existing.getName().equalsIgnoreCase(name)) {
                        return tagRepository.findByTenantIdAndCompanyIdAndName(tenantId, companyId, name)
                                .flatMap(clash -> Mono.<TagEntity>error(new RuntimeException("Ya existe otra etiqueta con este nombre en la compañía.")))
                                .switchIfEmpty(Mono.defer(() -> {
                                    existing.setName(name);
                                    if (request.getColor() != null) {
                                        existing.setColor(request.getColor());
                                    }
                                    existing.setUpdatedAt(LocalDateTime.now());
                                    return tagRepository.save(existing);
                                }));
                    } else {
                        if (request.getColor() != null) {
                            existing.setColor(request.getColor());
                        }
                        existing.setUpdatedAt(LocalDateTime.now());
                        return tagRepository.save(existing);
                    }
                });
    }

    public Mono<Void> deleteTag(Long id, Long tenantId, Long companyId) {
        log.info("Deleting tag ID: {} for tenant: {}, company: {}", id, tenantId, companyId);
        return getTagById(id, tenantId, companyId)
                .flatMap(tagRepository::delete);
    }

    public Flux<TagEntity> getTagsForContact(Long contactId, Long tenantId, Long companyId) {
        log.info("Fetching tags for contact ID: {} for tenant: {}, company: {}", contactId, tenantId, companyId);
        return contactService.findById(contactId, tenantId, companyId)
                .switchIfEmpty(Mono.error(new RuntimeException("Contacto no encontrado o no pertenece a esta compañía.")))
                .flatMapMany(contact -> tagRepository.findTagsByContactId(contactId));
    }

    @Transactional
    public Mono<Void> associateTagsToContact(Long contactId, ContactTagsRequest request, Long tenantId, Long companyId) {
        log.info("Associating tags to contact ID: {} in tenant: {}, company: {}", contactId, tenantId, companyId);
        if (request.getTagIds() == null || request.getTagIds().isEmpty()) {
            return Mono.empty();
        }

        return contactService.findById(contactId, tenantId, companyId)
                .switchIfEmpty(Mono.error(new RuntimeException("Contacto no encontrado o no pertenece a esta compañía.")))
                .flatMap(contact -> {
                    return Flux.fromIterable(request.getTagIds())
                            .flatMap(tagId -> tagRepository.findById(tagId)
                                    .filter(tag -> tag.getTenantId().equals(tenantId) && tag.getCompanyId().equals(companyId))
                                    .flatMap(tag -> tagRepository.isTagAssociated(contactId, tagId)
                                            .flatMap(count -> {
                                                if (count == 0) {
                                                    return tagRepository.associateTag(contactId, tagId);
                                                }
                                                return Mono.empty();
                                            })
                                    )
                            )
                            .then();
                });
    }

    @Transactional
    public Mono<Void> disassociateTagFromContact(Long contactId, Long tagId, Long tenantId, Long companyId) {
        log.info("Disassociating tag ID: {} from contact ID: {} in tenant: {}, company: {}", tagId, contactId, tenantId, companyId);
        return contactService.findById(contactId, tenantId, companyId)
                .switchIfEmpty(Mono.error(new RuntimeException("Contacto no encontrado o no pertenece a esta compañía.")))
                .flatMap(contact -> tagRepository.findById(tagId)
                        .filter(tag -> tag.getTenantId().equals(tenantId) && tag.getCompanyId().equals(companyId))
                        .switchIfEmpty(Mono.error(new RuntimeException("Etiqueta no encontrada o no pertenece a esta compañía.")))
                        .flatMap(tag -> tagRepository.disassociateTag(contactId, tagId))
                );
    }
}
