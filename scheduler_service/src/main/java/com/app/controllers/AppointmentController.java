package com.app.controllers;

import com.app.persistence.entity.AppointmentEntity;
import com.app.services.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Slf4j
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public Mono<AppointmentEntity> bookAppointment(@RequestBody AppointmentEntity appointment) {
        log.info("Booking appointment for contact: {}", appointment.getContactId());
        return appointmentService.bookAppointment(appointment);
    }

    @PatchMapping("/{id}/cancel")
    public Mono<Void> cancelAppointment(@PathVariable Long id, @RequestParam Long tenantId, @RequestParam Long companyId) {
        log.info("Cancelling appointment: {} (Tenant: {}, Company: {})", id, tenantId, companyId);
        return appointmentService.cancelAppointment(id, tenantId, companyId);
    }
}
