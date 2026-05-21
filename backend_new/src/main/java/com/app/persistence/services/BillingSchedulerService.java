package com.app.persistence.services;

import com.app.persistence.entity.SubscriptionEntity;
import com.app.persistence.entity.PaymentMethodEntity;
import com.app.persistence.entity.PlanEntity;
import com.app.persistence.repository.SubscriptionRepository;
import com.app.persistence.repository.TenantRepository;
import com.app.persistence.repository.UserRepository;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.repository.PaymentMethodRepository;
import com.app.persistence.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio programado para gestión del ciclo de vida de suscripciones.
 *
 * Lógica por método de pago:
 *  - TARJETA (payment_source_id != null) → Auto-débito vía billing-service (Wompi)
 *                                         → Si APPROVED: WhatsApp "Tu suscripción fue renovada ✅"
 *  - PSE / sin token                     → WhatsApp con enlace de pago manual 🔗
 *
 * El método runScheduler() puede llamarse manualmente desde BillingSchedulerController
 * para pruebas sin esperar la ejecución automática (8am y 6pm).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BillingSchedulerService {

    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final PlanRepository planRepository;
    private final EvolutionService evolutionService;
    private final WebClient.Builder webClientBuilder;

    private static final String NOTIFICATION_INSTANCE = "cloudfly_t1_c1";
    private static final int HOURS_AHEAD_ALERT = 24;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' hh:mm a");

    // =====================================================================
    // EJECUCIÓN AUTOMÁTICA
    // =====================================================================

    /** Cron: 8:00 AM y 6:00 PM hora Colombia */
    @Scheduled(cron = "0 0 8,18 * * ?")
    public void runSchedulerAuto() {
        log.info("⏰ [BILLING-SCHEDULER] Ejecución automática: {}", LocalDateTime.now());
        runScheduler().subscribe(
                r -> log.info("✅ [BILLING-SCHEDULER] Ciclo completado: {}", r),
                e -> log.error("❌ [BILLING-SCHEDULER] Error: {}", e.getMessage())
        );
    }

    // =====================================================================
    // MÉTODO PRINCIPAL (también usado por el controller para pruebas)
    // =====================================================================

    public Mono<SchedulerResult> runScheduler() {
        log.info("🚀 [BILLING-SCHEDULER] Iniciando ciclo de facturación...");
        SchedulerResult result = new SchedulerResult();

        // PASO 1: Procesar suscripciones próximas a vencer (notificar o auto-cobrar)
        Mono<Void> processExpiring = subscriptionRepository
                .findExpiringWithinHours(HOURS_AHEAD_ALERT)
                .flatMap(sub -> processExpiringSubscription(sub)
                        .then(Mono.fromRunnable(() -> result.processed++)))
                .then();

        // PASO 2: Suspender suscripciones ya vencidas sin pago
        Mono<Void> suspendExpired = subscriptionRepository
                .findExpiredSubscriptions()
                .flatMap(sub -> suspendSubscription(sub)
                        .then(Mono.fromRunnable(() -> result.suspended++)))
                .then();

        return processExpiring
                .then(suspendExpired)
                .then(Mono.fromCallable(() -> {
                    log.info("📊 [BILLING-SCHEDULER] Resultado: {} procesadas, {} suspendidas",
                            result.processed, result.suspended);
                    return result;
                }));
    }

    public Flux<SubscriptionEntity> getExpiringSubscriptions() {
        return subscriptionRepository.findExpiringWithinHours(HOURS_AHEAD_ALERT);
    }

    public Flux<SubscriptionEntity> getExpiredSubscriptions() {
        return subscriptionRepository.findExpiredSubscriptions();
    }

    // =====================================================================
    // LÓGICA POR MÉTODO DE PAGO
    // =====================================================================

    /**
     * Decide qué hacer según el método de pago del tenant:
     *  - Tarjeta tokenizada → intenta auto-cobro inmediato
     *  - PSE / sin token    → envía WhatsApp con link de pago
     */
    private Mono<Void> processExpiringSubscription(SubscriptionEntity sub) {
        return paymentMethodRepository.findByTenantIdAndIsDefaultTrue(sub.getCustomerId())
                .flatMap(pm -> {
                    boolean isCard = "WOMPI".equalsIgnoreCase(pm.getProvider())
                            && pm.getPaymentSourceId() != null
                            && !pm.getPaymentSourceId().isBlank();

                    if (isCard) {
                        log.info("💳 [BILLING-SCHEDULER] Sub {} → tarjeta tokenizada → auto-cobro", sub.getId());
                        return autoChargeCard(sub, pm);
                    } else {
                        log.info("🔗 [BILLING-SCHEDULER] Sub {} → PSE/sin token → link de pago", sub.getId());
                        return sendPaymentLinkNotification(sub, pm);
                    }
                })
                .switchIfEmpty(Mono.defer(() -> {
                    // Sin método de pago registrado → enviar link genérico
                    log.warn("⚠️ [BILLING-SCHEDULER] Sub {} sin método de pago → notificación genérica", sub.getId());
                    return sendPaymentLinkNotification(sub, null);
                }))
                .then();
    }

    // =====================================================================
    // AUTO-COBRO (TARJETA)
    // =====================================================================

    /**
     * Llama al billing-service (Go) para ejecutar el cobro automático con Wompi.
     * Si el cobro es APPROVED → extiende la suscripción + notifica renovación.
     * Si falla → envía link de pago como fallback.
     */
    private Mono<Void> autoChargeCard(SubscriptionEntity sub, PaymentMethodEntity pm) {
        Map<String, Object> body = new HashMap<>();
        body.put("eventType", "AUTO_CHARGE");
        body.put("tenantId", sub.getCustomerId());
        body.put("subscriptionId", sub.getId());

        return webClientBuilder.build()
                .post()
                .uri("http://billing-service:8080/api/billing/execute-event")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(response -> {
                    log.info("✅ [BILLING-SCHEDULER] Auto-cobro exitoso para sub {}", sub.getId());
                    return extendSubscription(sub)
                            .flatMap(updatedSub -> sendRenewalSuccessNotification(updatedSub, pm));
                })
                .onErrorResume(err -> {
                    log.error("❌ [BILLING-SCHEDULER] Auto-cobro fallido para sub {}: {}. Enviando link.",
                            sub.getId(), err.getMessage());
                    return sendPaymentLinkNotification(sub, pm);
                });
    }

    /**
     * Extiende la suscripción por el período del plan (ej. 30 días).
     */
    private Mono<SubscriptionEntity> extendSubscription(SubscriptionEntity sub) {
        return planRepository.findById(sub.getPlanId())
                .flatMap(plan -> {
                    int days = plan.getDurationDays() != null ? plan.getDurationDays() : 30;
                    LocalDateTime newEnd = LocalDateTime.now().plusDays(days);
                    sub.setStatus("ACTIVE");
                    sub.setStartDate(LocalDateTime.now());
                    sub.setEndDate(newEnd);
                    sub.setNextBillingDate(newEnd);
                    sub.setTrialEndsAt(null);
                    sub.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(sub);
                })
                .defaultIfEmpty(sub);
    }

    // =====================================================================
    // NOTIFICACIONES WHATSAPP
    // =====================================================================

    /**
     * Mensaje de renovación exitosa (tarjeta debitada automáticamente).
     * "Tu suscripción fue renovada ✅ + datos del período"
     */
    private Mono<Void> sendRenewalSuccessNotification(SubscriptionEntity sub, PaymentMethodEntity pm) {
        return getTenantPhone(sub.getCustomerId())
                .flatMap(phone -> {
                    if (phone.isBlank()) return Mono.empty();

                    String newEnd = sub.getEndDate().format(DATE_FMT);
                    String brand = pm != null && pm.getBrand() != null ? pm.getBrand() : "tarjeta";
                    String last4 = pm != null && pm.getLast4() != null ? "****" + pm.getLast4() : "";

                    String message = "✅ *Tu suscripción de CloudFly fue renovada*\n\n" +
                            "Tu cobro automático fue procesado exitosamente.\n\n" +
                            "📋 *Detalles de la renovación:*\n" +
                            "• Método de pago: " + brand + " " + last4 + "\n" +
                            "• Nuevo período hasta: *" + newEnd + "*\n" +
                            "• Estado: *Activa* ✅\n\n" +
                            "Gracias por confiar en CloudFly. 🚀\n" +
                            "Puedes ver tu factura en: https://app.cloudfly.com.co/billing";

                    return evolutionService.sendSimpleMessage(NOTIFICATION_INSTANCE, phone, message)
                            .doOnSuccess(r -> log.info("✅ Notificación renovación enviada a {} (sub {})", phone, sub.getId()))
                            .onErrorResume(e -> {
                                log.error("❌ Error WhatsApp renovación {}: {}", phone, e.getMessage());
                                return Mono.empty();
                            });
                })
                .then();
    }

    /**
     * Mensaje de aviso de vencimiento próximo con link de pago (PSE / sin token).
     */
    private Mono<Void> sendPaymentLinkNotification(SubscriptionEntity sub, PaymentMethodEntity pm) {
        return getTenantPhone(sub.getCustomerId())
                .flatMap(phone -> {
                    if (phone.isBlank()) {
                        log.warn("⚠️ [BILLING-SCHEDULER] Sin teléfono para sub {}. Omitiendo.", sub.getId());
                        return Mono.empty();
                    }

                    String vencimiento = sub.getEndDate().format(DATE_FMT);
                    String metodoPago = (pm != null && pm.getBrand() != null) ? pm.getBrand() : "PSE/Transferencia";

                    String message = "⚠️ *Aviso de CloudFly — Renovación Pendiente*\n\n" +
                            "Tu suscripción vence el *" + vencimiento + "*.\n\n" +
                            "📋 *Detalles:*\n" +
                            "• Método de pago: " + metodoPago + "\n" +
                            "• Para renovar, realiza el pago desde el siguiente enlace:\n\n" +
                            "🔗 https://app.cloudfly.com.co/billing\n\n" +
                            "Una vez confirmado el pago, tu cuenta se renovará automáticamente. 🙏";

                    return evolutionService.sendSimpleMessage(NOTIFICATION_INSTANCE, phone, message)
                            .doOnSuccess(r -> log.info("✅ Link de pago enviado a {} (sub {})", phone, sub.getId()))
                            .onErrorResume(e -> {
                                log.error("❌ Error WhatsApp link {}: {}", phone, e.getMessage());
                                return Mono.empty();
                            });
                })
                .then();
    }

    /**
     * Mensaje de suspensión por falta de pago.
     */
    private Mono<Void> suspendSubscription(SubscriptionEntity sub) {
        log.warn("🔒 [BILLING-SCHEDULER] Suspendiendo sub {}, customerId={}", sub.getId(), sub.getCustomerId());
        sub.setStatus("SUSPENDED");
        sub.setUpdatedAt(LocalDateTime.now());

        return subscriptionRepository.save(sub)
                .flatMap(saved -> getTenantPhone(saved.getCustomerId())
                        .flatMap(phone -> {
                            if (phone.isBlank()) return Mono.empty();

                            String message = "🔒 *Tu cuenta de CloudFly fue suspendida*\n\n" +
                                    "No se registró pago antes del vencimiento.\n\n" +
                                    "Tu información está segura. Para reactivar tu cuenta:\n" +
                                    "🔗 https://app.cloudfly.com.co/billing\n\n" +
                                    "¿Tienes preguntas? Escríbenos y te ayudamos. 🙏";

                            return evolutionService.sendSimpleMessage(NOTIFICATION_INSTANCE, phone, message)
                                    .onErrorResume(e -> {
                                        log.error("❌ Error WhatsApp suspensión {}: {}", phone, e.getMessage());
                                        return Mono.empty();
                                    });
                        })
                )
                .then();
    }

    // =====================================================================
    // UTILIDADES
    // =====================================================================

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
                                        .map(c -> c.getPhone() != null ? c.getPhone() : "")
                                        .defaultIfEmpty("");
                            })
                            .defaultIfEmpty("");
                })
                .defaultIfEmpty("");
    }

    // =====================================================================
    // DTO RESULTADO
    // =====================================================================

    public static class SchedulerResult {
        public int processed = 0;
        public int suspended = 0;

        @Override
        public String toString() {
            return String.format("SchedulerResult{processed=%d, suspended=%d}", processed, suspended);
        }
    }
}
