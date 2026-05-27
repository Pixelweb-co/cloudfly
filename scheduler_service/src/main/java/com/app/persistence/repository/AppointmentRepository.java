package com.app.persistence.repository;

import com.app.persistence.entity.AppointmentEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;

@Repository
public interface AppointmentRepository extends ReactiveCrudRepository<AppointmentEntity, Long> {
    Flux<AppointmentEntity> findByTenantIdAndCompanyIdAndStartTimeBetween(Long tenantId, Long companyId, LocalDateTime start, LocalDateTime end);
    Flux<AppointmentEntity> findByTenantIdAndCompanyIdAndUserIdAndStartTimeBetween(Long tenantId, Long companyId, Long userId, LocalDateTime start, LocalDateTime end);

    @org.springframework.data.r2dbc.repository.Query("SELECT COUNT(*) FROM appointments WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND status = 'PENDING' AND start_time >= NOW()")
    reactor.core.publisher.Mono<Integer> countPendingAppointments(Long tenantId, Long companyId);
}
