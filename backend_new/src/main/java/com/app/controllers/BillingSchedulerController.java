package com.app.controllers;

import com.app.persistence.services.BillingSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Controller para disparar manualmente el ciclo de facturación del scheduler.
 *
 * SOLO PARA PRUEBAS / ADMINISTRACIÓN INTERNA.
 * En producción este endpoint debería protegerse con un rol ADMIN o una API Key.
 *
 * Uso:
 *   POST https://api.cloudfly.com.co/api/billing/run-scheduler
 *
 * Respuesta:
 *   { "notified": 2, "suspended": 1, "message": "Ciclo completado exitosamente" }
 */
@Slf4j
@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingSchedulerController {

    private final BillingSchedulerService billingSchedulerService;

    /**
     * Dispara manualmente el ciclo completo del scheduler de facturación.
     * Útil para pruebas o para correr el ciclo fuera del horario del cron automático.
     */
    @PostMapping("/run-scheduler")
    public Mono<Map<String, Object>> runScheduler() {
        log.info("🔧 [BILLING-SCHEDULER-CONTROLLER] Ejecución manual solicitada.");
        return billingSchedulerService.runScheduler()
                .map(result -> {
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("notified", result.notified);
                    response.put("suspended", result.suspended);
                    response.put("message", "Ciclo de facturación completado exitosamente");
                    response.put("hoursAheadAlert", 24);
                    return response;
                })
                .onErrorResume(err -> {
                    log.error("❌ Error en ejecución manual del scheduler: {}", err.getMessage());
                    Map<String, Object> error = new java.util.HashMap<>();
                    error.put("error", err.getMessage());
                    error.put("message", "Error al ejecutar el ciclo de facturación");
                    return Mono.just(error);
                });
    }

    /**
     * Endpoint de diagnóstico: muestra qué suscripciones serían procesadas en el próximo ciclo.
     * No envía notificaciones, solo lista.
     */
    @GetMapping("/scheduler-preview")
    public Mono<Map<String, Object>> previewScheduler() {
        log.info("👁️ [BILLING-SCHEDULER-CONTROLLER] Preview del scheduler solicitado.");

        return billingSchedulerService.getExpiringSubscriptions()
                .collectList()
                .zipWith(billingSchedulerService.getExpiredSubscriptions().collectList())
                .map(tuple -> {
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("expiringSoon", tuple.getT1().size());
                    response.put("alreadyExpired", tuple.getT2().size());
                    response.put("expiringSoonIds", tuple.getT1().stream().map(s -> s.getId()).toList());
                    response.put("alreadyExpiredIds", tuple.getT2().stream().map(s -> s.getId()).toList());
                    response.put("message", "Preview generado. Usa POST /run-scheduler para ejecutar.");
                    return response;
                });
    }
}
