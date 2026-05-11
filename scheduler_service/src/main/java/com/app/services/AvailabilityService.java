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

    public Mono<Void> generateSlots(Long templateId) {
        return templateRepository.findById(templateId)
                .flatMap(template -> {
                    List<AvailabilitySlotEntity> slots = new ArrayList<>();
                    LocalDate today = LocalDate.now();
                    int daysToGenerate = template.getMaxFutureRange() != null ? template.getMaxFutureRange() : 30;

                    // Parse the weeklySchedule JSON
                    Map<String, Object> weeklySchedule = parseWeeklySchedule(template.getWeeklySchedule());

                    for (int i = 0; i < daysToGenerate; i++) {
                        LocalDate date = today.plusDays(i);
                        DayOfWeek dow = date.getDayOfWeek();

                        // Skip weekends if not allowed
                        if (!Boolean.TRUE.equals(template.getAllowWeekends()) && (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY)) {
                            continue;
                        }

                        // Get the schedule key for this day of week
                        String dayKey = getDayKey(dow);
                        Object dayConfig = weeklySchedule.get(dayKey);

                        if (dayConfig == null) {
                            // No configuration for this day: use defaults if weekday
                            if (dow.getValue() >= 1 && dow.getValue() <= 5) {
                                generateSlotsForDay(slots, date, template);
                            }
                            continue;
                        }

                        if (dayConfig instanceof Map) {
                            Map<String, Object> dayMap = (Map<String, Object>) dayConfig;
                            Boolean enabled = (Boolean) dayMap.getOrDefault("enabled", true);
                            if (!Boolean.TRUE.equals(enabled)) {
                                continue; // Day is disabled
                            }

                            // Parse time ranges
                            Object rangesObj = dayMap.get("ranges");
                            if (rangesObj instanceof List) {
                                List<Map<String, String>> ranges = (List<Map<String, String>>) rangesObj;
                                int duration = template.getDurationDefault() != null ? template.getDurationDefault() : 30;
                                int bufferAfter = template.getBufferAfter() != null ? template.getBufferAfter() : 0;

                                for (Map<String, String> range : ranges) {
                                    String startStr = range.get("start");
                                    String endStr = range.get("end");
                                    if (startStr != null && endStr != null) {
                                        LocalTime rangeStart = LocalTime.parse(startStr);
                                        LocalTime rangeEnd = LocalTime.parse(endStr);
                                        addSlots(slots, date, rangeStart, rangeEnd, duration, bufferAfter, template);
                                    }
                                }
                            } else {
                                // No ranges defined, use defaults for this enabled day
                                generateSlotsForDay(slots, date, template);
                            }
                        } else if (dayConfig instanceof Boolean) {
                            if (Boolean.TRUE.equals(dayConfig)) {
                                generateSlotsForDay(slots, date, template);
                            }
                            // false means day is disabled, skip
                        }
                    }

                    log.info("Generated {} slots for template {} over {} days", slots.size(), templateId, daysToGenerate);
                    return slotRepository.saveAll(slots).then();
                });
    }

    /**
     * Parses the weeklySchedule JSON string into a Map.
     * Expected JSON format:
     * {
     *   "lunes": { "enabled": true, "ranges": [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}] },
     *   "martes": { "enabled": true, "ranges": [{"start": "09:00", "end": "13:00"}] },
     *   "sabado": { "enabled": false },
     *   "domingo": false
     * }
     */
    private Map<String, Object> parseWeeklySchedule(String json) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return Map.of(); // Empty schedule → fallback to defaults
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Could not parse weeklySchedule JSON, using defaults: {}", e.getMessage());
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

    /**
     * Fallback: generates slots using default hours (8-12, 14-18) when no JSON config is provided.
     */
    private void generateSlotsForDay(List<AvailabilitySlotEntity> slots, LocalDate date, AvailabilityTemplateEntity template) {
        int duration = template.getDurationDefault() != null ? template.getDurationDefault() : 30;
        int bufferAfter = template.getBufferAfter() != null ? template.getBufferAfter() : 0;

        addSlots(slots, date, LocalTime.of(8, 0), LocalTime.of(12, 0), duration, bufferAfter, template);
        addSlots(slots, date, LocalTime.of(14, 0), LocalTime.of(18, 0), duration, bufferAfter, template);
    }

    private void addSlots(List<AvailabilitySlotEntity> slots, LocalDate date, LocalTime start, LocalTime end, int duration, int bufferAfter, AvailabilityTemplateEntity template) {
        LocalTime current = start;
        int dailyCount = 0;
        int dailyLimit = template.getDailyLimit() != null ? template.getDailyLimit() : Integer.MAX_VALUE;

        while ((current.plusMinutes(duration).isBefore(end) || current.plusMinutes(duration).equals(end)) && dailyCount < dailyLimit) {
            slots.add(AvailabilitySlotEntity.builder()
                    .tenantId(template.getTenantId())
                    .companyId(template.getCompanyId())
                    .userId(template.getUserId())
                    .templateId(template.getId())
                    .startTime(LocalDateTime.of(date, current))
                    .endTime(LocalDateTime.of(date, current.plusMinutes(duration)))
                    .status(EventStatus.AVAILABLE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
            current = current.plusMinutes(duration + bufferAfter);
            dailyCount++;
        }
    }
}
