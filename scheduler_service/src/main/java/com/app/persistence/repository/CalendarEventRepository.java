package com.app.persistence.repository;

import com.app.persistence.entity.CalendarEventEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

public interface CalendarEventRepository extends ReactiveCrudRepository<CalendarEventEntity, Long> {
    
    @Query("SELECT * FROM calendar_events WHERE tenant_id = :tenantId AND company_id = :companyId AND start_time BETWEEN :start AND :end")
    Flux<CalendarEventEntity> findByRange(Long tenantId, Long companyId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT * FROM calendar_events WHERE calendar_id = :calendarId")
    Flux<CalendarEventEntity> findByCalendarId(Long calendarId);
    @Query("DELETE FROM calendar_events WHERE calendar_id = :calendarId")
    Mono<Void> deleteByCalendarId(Long calendarId);

    @Query("SELECT * FROM calendar_events WHERE related_entity_type = :relatedEntityType AND related_entity_id = :relatedEntityId LIMIT 1")
    Mono<CalendarEventEntity> findByRelatedEntityTypeAndRelatedEntityId(String relatedEntityType, Long relatedEntityId);
}
