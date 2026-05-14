package com.app.services;

import com.app.dto.CalendarEventDto;
import com.app.persistence.entity.AppointmentEntity;
import com.app.persistence.entity.EventStatus;
import com.app.persistence.entity.EventType;
import com.app.persistence.repository.AppointmentRepository;
import com.app.persistence.repository.AvailabilitySlotRepository;
import com.app.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final CalendarEventService calendarEventService;
    private final ContactRepository contactRepository;

    @Transactional
    public Mono<AppointmentEntity> bookAppointment(AppointmentEntity appointment) {
        return slotRepository.findById(appointment.getSlotId())
                .flatMap(slot -> {
                    if (slot.getStatus() != EventStatus.AVAILABLE) {
                        return Mono.error(new RuntimeException("Slot is not available"));
                    }
                    slot.setStatus(EventStatus.RESERVED);
                    slot.setUpdatedAt(LocalDateTime.now());
                    
                    appointment.setStatus(EventStatus.RESERVED);
                    appointment.setStartTime(slot.getStartTime());
                    appointment.setEndTime(slot.getEndTime());
                    appointment.setCreatedAt(LocalDateTime.now());
                    appointment.setUpdatedAt(LocalDateTime.now());

                    return slotRepository.save(slot)
                            .then(appointmentRepository.save(appointment))
                            .flatMap(savedAppointment -> {
                                slot.setAppointmentId(savedAppointment.getId());
                                return slotRepository.save(slot)
                                        .then(createNotificationEvent(savedAppointment))
                                        .thenReturn(savedAppointment);
                            });
                });
    }

    @Transactional
    public Mono<Void> cancelAppointment(Long appointmentId, Long tenantId, Long companyId) {
        return appointmentRepository.findById(appointmentId)
                .filter(a -> a.getTenantId().equals(tenantId) && a.getCompanyId().equals(companyId))
                .flatMap(appointment -> {
                    appointment.setStatus(EventStatus.CANCELLED);
                    appointment.setUpdatedAt(LocalDateTime.now());
                    
                    return slotRepository.findById(appointment.getSlotId())
                            .flatMap(slot -> {
                                slot.setStatus(EventStatus.AVAILABLE);
                                slot.setAppointmentId(null);
                                slot.setUpdatedAt(LocalDateTime.now());
                                return slotRepository.save(slot);
                            })
                            .then(appointmentRepository.save(appointment))
                            .flatMap(saved -> deleteNotificationEvent(saved))
                            .then();
                });
    }

    private Mono<Void> createNotificationEvent(AppointmentEntity appointment) {
        return contactRepository.findById(appointment.getContactId())
                .flatMap(contact -> {
                    String email = contact.getEmail() != null ? contact.getEmail() : "";
                    String name = contact.getName() != null ? contact.getName() : "Cliente";
                    
                    // Create payload with recipient email, type notification, and notifyVia email
                    String payload = String.format(
                        "{\"remindBefore\": 24, \"remindUnit\": \"HOURS\", \"sendConfirmation\": true, \"to\": \"%s\", \"username\": \"%s\", \"contactName\": \"%s\", \"type\": \"notification\", \"notifyVia\": \"email\"}",
                        email, name, name
                    );

                    CalendarEventDto dto = CalendarEventDto.builder()
                            .tenantId(appointment.getTenantId())
                            .companyId(appointment.getCompanyId())
                            .calendarId(1L)
                            .title("Cita: " + appointment.getTitle())
                            .description(appointment.getObservations())
                            .eventType(EventType.NOTIFICATION)
                            .startTime(appointment.getStartTime())
                            .endTime(appointment.getEndTime())
                            .allDay(false)
                            .relatedEntityType("APPOINTMENT")
                            .relatedEntityId(appointment.getId())
                            .payload(payload)
                            .build();
                    
                    return calendarEventService.createEvent(dto);
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Contact not found for appointment {}, skipping notification email recipient", appointment.getId());
                    String payload = "{\"remindBefore\": 24, \"remindUnit\": \"HOURS\", \"sendConfirmation\": true, \"type\": \"notification\", \"notifyVia\": \"email\"}";
                    CalendarEventDto dto = CalendarEventDto.builder()
                            .tenantId(appointment.getTenantId())
                            .companyId(appointment.getCompanyId())
                            .calendarId(1L)
                            .title("Cita: " + appointment.getTitle())
                            .description(appointment.getObservations())
                            .eventType(EventType.NOTIFICATION)
                            .startTime(appointment.getStartTime())
                            .endTime(appointment.getEndTime())
                            .allDay(false)
                            .relatedEntityType("APPOINTMENT")
                            .relatedEntityId(appointment.getId())
                            .payload(payload)
                            .build();
                    return calendarEventService.createEvent(dto);
                }))
                .then();
    }

    private Mono<Void> deleteNotificationEvent(AppointmentEntity appointment) {
        // We update the notification status to CANCELLED instead of deleting it to keep history
        CalendarEventDto dto = CalendarEventDto.builder()
                .tenantId(appointment.getTenantId())
                .companyId(appointment.getCompanyId())
                .title("Cita CANCELADA: " + appointment.getTitle())
                .status(EventStatus.CANCELLED)
                .relatedEntityType("APPOINTMENT")
                .relatedEntityId(appointment.getId())
                .build();
        return calendarEventService.createEvent(dto).then();
    }
}
