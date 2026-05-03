package com.app.persistence.repository;

import com.app.persistence.entity.SendingListContactEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SendingListContactRepository extends ReactiveCrudRepository<SendingListContactEntity, Long> {
    @Query("SELECT * FROM sending_list_contacts WHERE sending_list_id = :listId")
    Flux<SendingListContactEntity> findBySendingListId(Long listId);

    @Query("SELECT COUNT(*) FROM sending_list_contacts WHERE sending_list_id = :listId AND status = 'ACTIVE'")
    Mono<Integer> countActiveBySendingListId(Long listId);

    @Query("DELETE FROM sending_list_contacts WHERE sending_list_id = :listId AND contact_id = :contactId")
    Mono<Void> deleteBySendingListIdAndContactId(Long listId, Long contactId);

    @Query("SELECT * FROM sending_list_contacts WHERE sending_list_id = :listId AND contact_id = :contactId")
    Mono<SendingListContactEntity> findBySendingListIdAndContactId(Long listId, Long contactId);

    @Query("SELECT c.* FROM contacts c INNER JOIN sending_list_contacts slc ON c.id = slc.contact_id WHERE slc.sending_list_id = :listId AND slc.status = 'ACTIVE'")
    Flux<com.app.persistence.entity.ContactEntity> findContactsByListId(Long listId);
}
