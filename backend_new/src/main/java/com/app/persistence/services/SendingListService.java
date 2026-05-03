package com.app.persistence.services;

import com.app.persistence.entity.SendingListContactEntity;
import com.app.persistence.entity.SendingListEntity;
import com.app.persistence.repository.SendingListContactRepository;
import com.app.persistence.repository.SendingListRepository;
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
public class SendingListService {

    private final SendingListRepository sendingListRepository;
    private final SendingListContactRepository sendingListContactRepository;

    public Flux<SendingListEntity> findAll(Long tenantId, Long companyId) {
        log.info("Fetching all sending lists for tenant: {}, company: {}", tenantId, companyId);
        return sendingListRepository.findByTenantIdAndCompanyId(tenantId, companyId);
    }

    public Mono<SendingListEntity> findById(Long id, Long tenantId, Long companyId) {
        return sendingListRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId);
    }

    public Mono<SendingListEntity> create(SendingListEntity list, Long tenantId, Long companyId) {
        list.setTenantId(tenantId);
        list.setCompanyId(companyId);
        list.setTotalContacts(0);
        list.setStatus("ACTIVE");
        list.setCreatedAt(LocalDateTime.now());
        list.setUpdatedAt(LocalDateTime.now());

        log.info("Creating new sending list: {} for tenant: {}", list.getName(), tenantId);
        return sendingListRepository.save(list);
    }

    public Mono<SendingListEntity> update(Long id, SendingListEntity list, Long tenantId, Long companyId) {
        return sendingListRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(existing -> {
                    existing.setName(list.getName());
                    existing.setDescription(list.getDescription());
                    existing.setStatus(list.getStatus());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return sendingListRepository.save(existing);
                });
    }

    public Mono<Void> delete(Long id, Long tenantId, Long companyId) {
        return sendingListRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(list -> {
                    log.info("Archiving sending list: {}", id);
                    list.setStatus("ARCHIVED");
                    list.setUpdatedAt(LocalDateTime.now());
                    return sendingListRepository.save(list).then();
                });
    }

    @Transactional
    public Mono<Void> addContactToList(Long listId, Long contactId, Long tenantId, Long companyId) {
        return sendingListRepository.findByIdAndTenantIdAndCompanyId(listId, tenantId, companyId)
                .switchIfEmpty(Mono.error(new RuntimeException("Lista no encontrada o sin acceso")))
                .flatMap(list -> sendingListContactRepository.findBySendingListIdAndContactId(listId, contactId)
                        .flatMap(existing -> Mono.<Void>error(new RuntimeException("El contacto ya está en la lista")))
                        .switchIfEmpty(Mono.defer(() -> {
                            SendingListContactEntity association = SendingListContactEntity.builder()
                                    .sendingListId(listId)
                                    .contactId(contactId)
                                    .status("ACTIVE")
                                    .addedAt(LocalDateTime.now())
                                    .build();
                            
                            return sendingListContactRepository.save(association)
                                    .then(updateTotalContacts(listId));
                        })));
    }

    @Transactional
    public Mono<Void> removeContactFromList(Long listId, Long contactId, Long tenantId, Long companyId) {
        return sendingListRepository.findByIdAndTenantIdAndCompanyId(listId, tenantId, companyId)
                .switchIfEmpty(Mono.error(new RuntimeException("Lista no encontrada o sin acceso")))
                .flatMap(list -> sendingListContactRepository.deleteBySendingListIdAndContactId(listId, contactId)
                        .then(updateTotalContacts(listId)));
    }

    private Mono<Void> updateTotalContacts(Long listId) {
        return sendingListContactRepository.countActiveBySendingListId(listId)
                .flatMap(count -> sendingListRepository.findById(listId)
                        .flatMap(list -> {
                            list.setTotalContacts(count);
                            return sendingListRepository.save(list);
                        }))
                .then();
    }
}
