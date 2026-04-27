package com.app.persistence.repository;

import com.app.persistence.entity.CalendarEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface CalendarRepository extends ReactiveCrudRepository<CalendarEntity, Long> {
    @Query("SELECT * FROM calendars WHERE tenant_id = :tenantId AND company_id = :companyId AND is_active = TRUE")
    Flux<CalendarEntity> findByTenantAndCompany(Long tenantId, Long companyId);
}
