package com.app.persistence.repository;

import com.app.persistence.entity.AvailabilitySlotEntity;
import com.app.persistence.entity.EventStatus;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;

@Repository
public interface AvailabilitySlotRepository extends ReactiveCrudRepository<AvailabilitySlotEntity, Long> {
    @Query("SELECT * FROM availability_slots WHERE tenant_id = :tenantId AND company_id = :companyId AND start_time BETWEEN :start AND :end ORDER BY start_time ASC")
    Flux<AvailabilitySlotEntity> findByTenantIdAndCompanyIdAndStartTimeBetween(Long tenantId, Long companyId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT * FROM availability_slots WHERE tenant_id = :tenantId AND company_id = :companyId AND user_id = :userId AND start_time BETWEEN :start AND :end")
    Flux<AvailabilitySlotEntity> findByTenantIdAndCompanyIdAndUserIdAndStartTimeBetween(Long tenantId, Long companyId, Long userId, LocalDateTime start, LocalDateTime end);

    Flux<AvailabilitySlotEntity> findByTenantIdAndCompanyIdAndStatus(Long tenantId, Long companyId, EventStatus status);
}
