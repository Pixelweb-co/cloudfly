package com.app.persistence.repository;

import org.springframework.data.r2dbc.repository.Query;
import com.app.persistence.entity.SubscriptionEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SubscriptionRepository extends ReactiveCrudRepository<SubscriptionEntity, Long> {
    @Query("SELECT * FROM subscriptions WHERE customer_id = :customerId")
    Flux<SubscriptionEntity> findByCustomerId(Long customerId);

    @Query("SELECT * FROM subscriptions WHERE customer_id = :customerId AND status = :status ORDER BY end_date DESC LIMIT 1")
    Mono<SubscriptionEntity> findFirstByCustomerIdAndStatusOrderByEndDateDesc(Long customerId, String status);

    @Query("SELECT * FROM subscriptions WHERE customer_id = :customerId AND status IN ('ACTIVE', 'TRIAL') ORDER BY end_date DESC LIMIT 1")
    Mono<SubscriptionEntity> findActiveOrTrialSubscription(Long customerId);

    /**
     * Busca suscripciones ACTIVAS o TRIAL que vencen dentro de las próximas :hoursAhead horas.
     * Usado por el BillingSchedulerService para enviar notificaciones de cobro.
     */
    @Query("SELECT * FROM subscriptions WHERE status IN ('ACTIVE', 'TRIAL') AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL :hoursAhead HOUR)")
    Flux<SubscriptionEntity> findExpiringWithinHours(int hoursAhead);

    /**
     * Busca suscripciones VENCIDAS (end_date pasó) que aún están en estado ACTIVE o TRIAL.
     * Usado por el BillingSchedulerService para suspender cuentas sin pago.
     */
    @Query("SELECT * FROM subscriptions WHERE status IN ('ACTIVE', 'TRIAL') AND end_date < NOW()")
    Flux<SubscriptionEntity> findExpiredSubscriptions();
}

