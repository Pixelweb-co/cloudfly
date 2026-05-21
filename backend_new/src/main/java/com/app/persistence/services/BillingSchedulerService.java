package com.app.persistence.services;

import com.app.persistence.entity.SubscriptionEntity;
import com.app.persistence.entity.TenantEntity;
import com.app.persistence.repository.SubscriptionRepository;
import com.app.persistence.repository.TenantRepository;
import com.app.persistence.repository.UserRepository;
import com.app.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Servicio programado para gestión del ciclo de vida de suscripciones.
 *
 * Ejecuta dos tareas:
 * 1. Notificar suscripciones próximas a vencer (por WhatsApp).
 * 2. Suspender suscripciones ya vencidas sin pago.
 *
 * El método runScheduler() puede llamarse manualmente desde BillingSchedulerController
 * para pruebas sin esperar la ejecución automática (medianoche).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BillingSchedulerService {

    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final EvolutionService evolutionService;

    // Instancia de WhatsApp usada para enviar notificaciones del sistema
    private static final String NOTIFICATION_INSTANCE = "cloudfly_t1_c1";

    // Ventana de alerta: suscripciones que vencen en las próximas N horas recibirán aviso
    private static final int HOURS_AHEAD_ALERT = 24;

    /**
     * Ejecución automática: todos los días a las 8:00 AM y 6:00 PM hora Colombia.
     * Cron: segundo minuto hora * * ?
     */
    @Scheduled(cron = "0 0 8,18 * * ?")
    public void runSchedulerAuto() {
        log.info("⏰ [BILLING-SCHEDULER] Ejecución automática iniciada: {}", LocalDateTime.now());
        runScheduler().subscribe(
                result -> log.info("✅ [BILLING-SCHEDULER] Ciclo completado: {}", result),
                error -> log.error("❌ [BILLING-SCHEDULER] Error en ciclo: {}", error.getMessage())
        );
    }

    /**
     * Método principal del scheduler. Puede llamarse manualmente para pruebas.
     * Retorna un resumen de las acciones tomadas.
     */
    public Mono<SchedulerResult> runScheduler() {
        log.info("🚀 [BILLING-SCHEDULER] Iniciando ciclo de facturación...");

        SchedulerResult result = new SchedulerResult();

        // PASO 1: Notificar suscripciones próximas a vencer
        Mono<Void> notifyExpiring = subscriptionRepository
                .findExpiringWithinHours(HOURS_AHEAD_ALERT)
                .flatMap(sub -> notifySubscriptionExpiring(sub).then(Mono.fromRunnable(() -> result.notified++)))
                .then();

        // PASO 2: Suspender suscripciones ya vencidas
        Mono<Void> suspendExpired = subscriptionRepository
                .findExpiredSubscriptions()
                .flatMap(sub -> suspendSubscription(sub).then(Mono.fromRunnable(() -> result.suspended++)))
                .then();

        return notifyExpiring
                .then(suspendExpired)
                .then(Mono.fromCallable(() -> {
                    log.info("📊 [BILLING-SCHEDULER] Resultado: {} notificadas, {} suspendidas", result.notified, result.suspended);
                    return result;
                }));
    }

    /** Expone las suscripciones próximas a vencer para el endpoint de preview. */
    public reactor.core.publisher.Flux<SubscriptionEntity> getExpiringSubscriptions() {
        return subscriptionRepository.findExpiringWithinHours(HOURS_AHEAD_ALERT);
    }

    /** Expone las suscripciones ya vencidas para el endpoint de preview. */
    public reactor.core.publisher.Flux<SubscriptionEntity> getExpiredSubscriptions() {
        return subscriptionRepository.findExpiredSubscriptions();
    }


    // =====================================================================
    // LÓGICA INTERNA
    // =====================================================================

    /**
     * Envía una notificación de WhatsApp al admin del tenant cuando su suscripción
     * está próxima a vencer.
     */
    private Mono<Void> notifySubscriptionExpiring(SubscriptionEntity sub) {
        log.info("📨 [BILLING-SCHEDULER] Notificando suscripción próxima a vencer: id={}, customerId={}, endDate={}",
                sub.getId(), sub.getCustomerId(), sub.getEndDate());

        return getTenantPhone(sub.getCustomerId())
                .flatMap(phone -> {
                    if (phone == null || phone.isBlank()) {
                        log.warn("⚠️ [BILLING-SCHEDULER] Sin teléfono para customerId={}. Omitiendo.", sub.getCustomerId());
                        return Mono.empty();
                    }

                    String formattedDate = sub.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm"));
                    String message = "⚠️ *Aviso de CloudFly*\n\n" +
                            "Tu suscripción vence el *" + formattedDate + "*.\n\n" +
                            "Para continuar usando el servicio sin interrupciones, realiza el pago " +
                            "de tu plan a través del siguiente enlace:\n\n" +
                            "🔗 https://app.cloudfly.com.co/billing\n\n" +
                            "Si tienes dudas, escríbenos y con gusto te ayudamos. 😊";

                    return evolutionService.sendSimpleMessage(NOTIFICATION_INSTANCE, phone, message)
                            .doOnSuccess(r -> log.info("✅ [BILLING-SCHEDULER] Notificación enviada a {} (sub id={})", phone, sub.getId()))
                            .onErrorResume(err -> {
                                log.error("❌ [BILLING-SCHEDULER] Error enviando WhatsApp a {}: {}", phone, err.getMessage());
                                return Mono.empty();
                            });
                })
                .then();
    }

    /**
     * Cambia el estado de la suscripción a SUSPENDED cuando ya venció sin pago.
     */
    private Mono<Void> suspendSubscription(SubscriptionEntity sub) {
        log.warn("🔒 [BILLING-SCHEDULER] Suspendiendo suscripción vencida: id={}, customerId={}, endDate={}",
                sub.getId(), sub.getCustomerId(), sub.getEndDate());

        sub.setStatus("SUSPENDED");
        sub.setUpdatedAt(LocalDateTime.now());

        return subscriptionRepository.save(sub)
                .flatMap(saved -> getTenantPhone(saved.getCustomerId())
                        .flatMap(phone -> {
                            if (phone == null || phone.isBlank()) return Mono.empty();

                            String message = "🔒 *Tu cuenta de CloudFly ha sido suspendida*\n\n" +
                                    "Tu período de prueba/suscripción venció sin que se registrara un pago.\n\n" +
                                    "Para reactivar tu cuenta, realiza el pago en:\n" +
                                    "🔗 https://app.cloudfly.com.co/billing\n\n" +
                                    "Tu información está segura y disponible en cuanto reactives. 🙏";

                            return evolutionService.sendSimpleMessage(NOTIFICATION_INSTANCE, phone, message)
                                    .onErrorResume(err -> {
                                        log.error("❌ Error enviando suspensión a {}: {}", phone, err.getMessage());
                                        return Mono.empty();
                                    });
                        })
                )
                .then();
    }

    /**
     * Obtiene el teléfono del administrador del tenant dado su customerId.
     * Busca en: tenant.phone → user.phone → contact.phone (en ese orden).
     */
    private Mono<String> getTenantPhone(Long customerId) {
        return tenantRepository.findById(customerId)
                .flatMap(tenant -> {
                    if (tenant.getPhone() != null && !tenant.getPhone().isBlank()) {
                        return Mono.just(tenant.getPhone());
                    }
                    if (tenant.getAdminUserId() == null) return Mono.just("");

                    return userRepository.findById(tenant.getAdminUserId())
                            .flatMap(user -> {
                                if (user.getContactId() == null) return Mono.just("");
                                return contactRepository.findById(user.getContactId())
                                        .map(contact -> contact.getPhone() != null ? contact.getPhone() : "")
                                        .defaultIfEmpty("");
                            })
                            .defaultIfEmpty("");
                })
                .defaultIfEmpty("");
    }

    // =====================================================================
    // DTO DE RESULTADO
    // =====================================================================

    public static class SchedulerResult {
        public int notified = 0;
        public int suspended = 0;

        @Override
        public String toString() {
            return String.format("SchedulerResult{notified=%d, suspended=%d}", notified, suspended);
        }
    }
}
