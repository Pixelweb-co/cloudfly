package com.app.persistence.repository;

import com.app.persistence.entity.CalendarEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CalendarRepository extends ReactiveCrudRepository<CalendarEntity, Long> {

    Flux<CalendarEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    Mono<CalendarEntity> findByIdAndTenantIdAndCompanyId(Long id, Long tenantId, Long companyId);
}
