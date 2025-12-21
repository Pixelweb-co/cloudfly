package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Subscription;
import com.app.starter1.persistence.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    // Queries basadas en User (legacy)
    Optional<Subscription> findByUserIdAndStatus(Long userId, SubscriptionStatus status);

    List<Subscription> findByUserId(Long userId);

    // Queries basadas en Customer (organizacion/tenant)
    Optional<Subscription> findByCustomerIdAndStatus(Long customerId, SubscriptionStatus status);

    List<Subscription> findByCustomerId(Long customerId);

    // Query general por estado
    List<Subscription> findByStatus(SubscriptionStatus status);

    // Query para obtener suscripción activa con módulos (eager loading)
    @Query("SELECT s FROM Subscription s LEFT JOIN FETCH s.modules WHERE s.customer.id = :customerId AND s.status = 'ACTIVE'")
    Optional<Subscription> findActiveTenantSubscriptionWithModules(@Param("customerId") Long customerId);
}
