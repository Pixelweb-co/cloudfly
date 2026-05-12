package com.app.persistence.repository;

import com.app.persistence.entity.AppointmentEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;

public interface AppointmentRepository extends ReactiveCrudRepository<AppointmentEntity, Long> {
    
    @Query("SELECT * FROM appointments WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND start_time >= :start AND start_time <= :end ORDER BY start_time ASC")
    Flux<AppointmentEntity> findTodayAppointments(Long tenantId, Long companyId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(*) FROM appointments WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND status = 'PENDING' AND start_time >= NOW()")
    reactor.core.publisher.Mono<Integer> countPendingAppointments(Long tenantId, Long companyId);
}
