package com.app.persistence.repository;

import com.app.persistence.entity.CalendarEventEntity;
import com.app.persistence.entity.EventStatus;
import com.app.persistence.entity.EventType;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface CalendarEventRepository extends ReactiveCrudRepository<CalendarEventEntity, Long> {

    Flux<CalendarEventEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    Mono<CalendarEventEntity> findByIdAndTenantIdAndCompanyId(Long id, Long tenantId, Long companyId);

    @Query("SELECT * FROM calendar_events WHERE tenant_id = :tenantId AND company_id = :companyId " +
           "AND (:calendarId IS NULL OR calendar_id = :calendarId) " +
           "AND (:eventType IS NULL OR event_type = :eventType) " +
           "AND (:status IS NULL OR status = :status) " +
           "AND (:startDate IS NULL OR start_time >= :startDate) " +
           "AND (:endDate IS NULL OR end_time <= :endDate)")
    Flux<CalendarEventEntity> findWithFilters(Long tenantId, Long companyId, Long calendarId, 
                                              String eventType, String status, 
                                              LocalDateTime startDate, LocalDateTime endDate);
}
