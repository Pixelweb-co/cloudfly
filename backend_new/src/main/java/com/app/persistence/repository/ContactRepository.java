package com.app.persistence.repository;

import com.app.persistence.entity.ContactEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ContactRepository extends ReactiveCrudRepository<ContactEntity, Long> {
    Flux<ContactEntity> findByTenantId(Long tenantId);
    Mono<ContactEntity> findByTenantIdAndPhone(Long tenantId, String phone);
}
