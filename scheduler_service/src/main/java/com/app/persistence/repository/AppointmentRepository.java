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
}
