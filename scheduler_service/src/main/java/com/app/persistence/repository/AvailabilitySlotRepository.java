package com.app.persistence.repository;

import com.app.persistence.entity.AvailabilitySlotEntity;
import com.app.persistence.entity.EventStatus;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;

@Repository
public interface AvailabilitySlotRepository extends ReactiveCrudRepository<AvailabilitySlotEntity, Long> {
    Flux<AvailabilitySlotEntity> findByTenantIdAndCompanyIdAndStartTimeBetween(Long tenantId, Long companyId, LocalDateTime start, LocalDateTime end);
    Flux<AvailabilitySlotEntity> findByUserIdAndStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);
    Flux<AvailabilitySlotEntity> findByTenantIdAndCompanyIdAndStatus(Long tenantId, Long companyId, EventStatus status);
}
