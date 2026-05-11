package com.app.services;

import com.app.dto.AvailabilitySlotDto;
import com.app.persistence.entity.AvailabilitySlotEntity;
import com.app.persistence.entity.AvailabilityTemplateEntity;
import com.app.persistence.entity.EventStatus;
import com.app.persistence.repository.AppointmentRepository;
import com.app.persistence.repository.AvailabilitySlotRepository;
import com.app.persistence.repository.AvailabilityTemplateRepository;
import com.app.persistence.repository.ContactRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityTemplateRepository templateRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final AppointmentRepository appointmentRepository;
    private final ContactRepository contactRepository;
    private final ObjectMapper objectMapper;

    public Mono<AvailabilityTemplateEntity> saveTemplate(AvailabilityTemplateEntity template) {
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        return templateRepository.save(template);
    }

    public Flux<AvailabilitySlotDto> getSlots(Long tenantId, Long companyId, LocalDateTime start, LocalDateTime end) {
        return slotRepository.findByTenantIdAndCompanyIdAndStartTimeBetween(tenantId, companyId, start, end)
                .flatMap(slot -> {
                    AvailabilitySlotDto dto = AvailabilitySlotDto.builder()
                            .id(slot.getId())
                            .tenantId(slot.getTenantId())
                            .companyId(slot.getCompanyId())
                            .userId(slot.getUserId())
                            .templateId(slot.getTemplateId())
                            .startTime(slot.getStartTime())
                            .endTime(slot.getEndTime())
                            .status(slot.getStatus())
                            .appointmentId(slot.getAppointmentId())
                            .build();

                    if (slot.getAppointmentId() != null) {
                        return appointmentRepository.findById(slot.getAppointmentId())
                                .flatMap(app -> {
                                    dto.setAppointmentTitle(app.getTitle());
                                    dto.setAppointmentChannel(app.getChannel());
                                    if (app.getContactId() != null) {
                                        return contactRepository.findById(app.getContactId())
                                                .map(contact -> {
                                                    dto.setContactName(contact.getName());
                                                    dto.setContactEmail(contact.getEmail());
                                                    dto.setContactPhone(contact.getPhone());
                                                    return dto;
                                                })
                                                .defaultIfEmpty(dto);
                                    }
                                    return Mono.just(dto);
                                })
                                .defaultIfEmpty(dto);
                    }
                    return Mono.just(dto);
                });
    }

    public Mono<Void> generateSlots(Long templateId, LocalDate startDate, LocalDate endDate) {
        return templateRepository.findById(templateId)
                .flatMap(template -> {
                    List<AvailabilitySlotEntity> slots = new ArrayList<>();
                    LocalDate currentGenDate = startDate != null ? startDate : LocalDate.now();
                    LocalDate endGenDate = endDate != null ? endDate : currentGenDate.plusDays(template.getMaxFutureRange() != null ? template.getMaxFutureRange() : 30);

                    // Parse JSON configs
                    Map<String, Object> weeklySchedule = parseJson(template.getWeeklySchedule());
                    Map<String, Object> exceptions = parseJson(template.getExceptions());

                    while (!currentGenDate.isAfter(endGenDate)) {
                        String dateKey = currentGenDate.toString(); // "YYYY-MM-DD"
                        
                        // 1. Check for specific exceptions for this date
                        if (exceptions.containsKey(dateKey)) {
                            Object excConfig = exceptions.get(dateKey);
                            processDayConfig(slots, currentGenDate, template, excConfig);
                        } else {
                            // 2. Regular weekly schedule
                            DayOfWeek dow = currentGenDate.getDayOfWeek();
                            if (template.getAllowWeekends() || (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY)) {
                                String dayKey = getDayKey(dow);
                                Object dayConfig = weeklySchedule.get(dayKey);
                                processDayConfig(slots, currentGenDate, template, dayConfig);
                            }
                        }
                        currentGenDate = currentGenDate.plusDays(1);
                    }

                    log.info("Generated {} slots for template {} (Service: {})", slots.size(), templateId, template.getServiceId());
                    return slotRepository.saveAll(slots).then();
                });
    }

    private void processDayConfig(List<AvailabilitySlotEntity> slots, LocalDate date, AvailabilityTemplateEntity template, Object config) {
        if (config == null) return;

        int duration = template.getDurationDefault() != null ? template.getDurationDefault() : 30;
        int bufferAfter = template.getBufferAfter() != null ? template.getBufferAfter() : 0;

        if (config instanceof Map) {
            Map<String, Object> dayMap = (Map<String, Object>) config;
            Boolean enabled = (Boolean) dayMap.getOrDefault("enabled", true);
            if (!enabled) return;

            List<Map<String, String>> ranges = (List<Map<String, String>>) dayMap.get("ranges");
            if (ranges != null) {
                for (Map<String, String> range : ranges) {
                    LocalTime start = LocalTime.parse(range.get("start"));
                    LocalTime end = LocalTime.parse(range.get("end"));
                    addSlots(slots, date, start, end, duration, bufferAfter, template);
                }
            }
        } else if (config instanceof Boolean && (Boolean) config) {
            // Default hours if true
            addSlots(slots, date, LocalTime.of(8, 0), LocalTime.of(12, 0), duration, bufferAfter, template);
            addSlots(slots, date, LocalTime.of(14, 0), LocalTime.of(18, 0), duration, bufferAfter, template);
        }
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Could not parse JSON: {}", e.getMessage());
            return Map.of();
        }
    }

    private String getDayKey(DayOfWeek dow) {
        switch (dow) {
            case MONDAY: return "lunes";
            case TUESDAY: return "martes";
            case WEDNESDAY: return "miercoles";
            case THURSDAY: return "jueves";
            case FRIDAY: return "viernes";
            case SATURDAY: return "sabado";
            case SUNDAY: return "domingo";
            default: return "";
        }
    }

    private void addSlots(List<AvailabilitySlotEntity> slots, LocalDate date, LocalTime start, LocalTime end, int duration, int bufferAfter, AvailabilityTemplateEntity template) {
        LocalTime current = start;
        while (current.plusMinutes(duration).isBefore(end) || current.plusMinutes(duration).equals(end)) {
            slots.add(AvailabilitySlotEntity.builder()
                    .tenantId(template.getTenantId())
                    .companyId(template.getCompanyId())
                    .userId(template.getUserId())
                    .templateId(template.getId())
                    .serviceId(template.getServiceId())
                    .startTime(LocalDateTime.of(date, current))
                    .endTime(LocalDateTime.of(date, current.plusMinutes(duration)))
                    .status(EventStatus.AVAILABLE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
            current = current.plusMinutes(duration + bufferAfter);
        }
    }
}
