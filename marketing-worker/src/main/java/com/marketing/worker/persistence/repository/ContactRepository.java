package com.marketing.worker.persistence.repository;

import com.marketing.worker.persistence.entity.ContactEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ContactRepository extends ReactiveCrudRepository<ContactEntity, Long> {

    @Query("SELECT c.* FROM contacts c " +
           "JOIN sending_list_contacts slc ON c.id = slc.contact_id " +
           "WHERE slc.sending_list_id = :listId AND c.is_active = 1")
    Flux<ContactEntity> findBySendingListId(Long listId);

    @Query("SELECT * FROM contacts " +
           "WHERE pipeline_id = :pipelineId AND stage = :stage AND is_active = 1")
    Flux<ContactEntity> findByPipelineAndStage(Long pipelineId, String stage);
}
