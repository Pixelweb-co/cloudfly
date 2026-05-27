package com.app.services;

import com.app.dto.AvailabilitySlotDto;
import com.app.dto.ServiceAvailabilityDto;
import com.app.persistence.entity.AvailabilitySlotEntity;
import com.app.persistence.entity.AvailabilityTemplateEntity;
import com.app.persistence.entity.EventStatus;
import com.app.persistence.repository.AppointmentRepository;
import com.app.persistence.repository.AvailabilitySlotRepository;
import com.app.persistence.repository.AvailabilityTemplateRepository;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.repository.UserRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityTemplateRepository templateRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final AppointmentRepository appointmentRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
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
                            .serviceId(slot.getServiceId())
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

    public Mono<Void> generateSlots(Long tenantId, Long companyId, Long templateId, LocalDate startDate, LocalDate endDate) {
        return templateRepository.findById(templateId)
                .filter(t -> t.getTenantId().equals(tenantId) && t.getCompanyId().equals(companyId))
                .flatMap(template -> {
                    LocalDate currentGenDate = startDate != null ? startDate : LocalDate.now();
                    LocalDate endGenDate = endDate != null ? endDate : currentGenDate.plusDays(template.getMaxFutureRange() != null ? template.getMaxFutureRange() : 30);

                    // Fetch all existing slots for this user to avoid overlaps
                    return slotRepository.findByTenantIdAndCompanyIdAndUserIdAndStartTimeBetween(template.getTenantId(), template.getCompanyId(), template.getUserId(), currentGenDate.atStartOfDay(), endGenDate.plusDays(1).atStartOfDay())
                            .collectList()
                            .flatMap(existingSlots -> {
                                List<AvailabilitySlotEntity> slotsToSave = new ArrayList<>();
                                
                                // Parse JSON configs
                                Map<String, Object> weeklySchedule = parseJson(template.getWeeklySchedule());
                                List<Map<String, Object>> exceptions = parseJsonList(template.getExceptions());

                                LocalDate movingDate = currentGenDate;
                                while (!movingDate.isAfter(endGenDate)) {
                                    // 1. Check if movingDate is within any exception range
                                    final LocalDate d = movingDate;
                                    Map<String, Object> activeException = exceptions.stream()
                                            .filter(exc -> {
                                                LocalDate startExc = LocalDate.parse((String) exc.get("startDate"));
                                                LocalDate endExc = LocalDate.parse((String) exc.get("endDate"));
                                                return !d.isBefore(startExc) && !d.isAfter(endExc);
                                            })
                                            .findFirst()
                                            .orElse(null);

                                    if (activeException != null) {
                                        // Apply Exception
                                        Boolean allDay = (Boolean) activeException.getOrDefault("allDay", false);
                                        Boolean enabled = (Boolean) activeException.getOrDefault("enabled", false);
                                        
                                        if (enabled && !allDay) {
                                            // Available only in specific ranges of the exception
                                            processDayConfig(slotsToSave, movingDate, template, activeException, existingSlots);
                                        }
                                        // If !enabled OR (enabled && allDay), we don't do anything here (either blocked or handled by allDay logic if it was available)
                                        // Wait, if enabled && allDay, it should generate default hours or whatever is configured.
                                        // But usually exceptions are for BLOCKING or CUSTOM HOURS.
                                        if (enabled && allDay) {
                                            processDayConfig(slotsToSave, movingDate, template, true, existingSlots);
                                        }
                                    } else {
                                        // 2. Regular weekly schedule
                                        DayOfWeek dow = movingDate.getDayOfWeek();
                                        if (template.getAllowWeekends() || (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY)) {
                                            processDayConfig(slotsToSave, movingDate, template, weeklySchedule.get(getDayKey(dow)), existingSlots);
                                        }
                                    }
                                    movingDate = movingDate.plusDays(1);
                                }

                                log.info("Generated {} NEW slots for template {} (Service: {}) after checking overlaps", slotsToSave.size(), templateId, template.getServiceId());
                                return slotRepository.saveAll(slotsToSave).then();
                            });
                });
    }

    private void processDayConfig(List<AvailabilitySlotEntity> slots, LocalDate date, AvailabilityTemplateEntity template, Object config, List<AvailabilitySlotEntity> existingSlots) {
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
                    addSlotsWithOverlapCheck(slots, date, start, end, duration, bufferAfter, template, existingSlots);
                }
            }
        } else if (config instanceof Boolean && (Boolean) config) {
            addSlotsWithOverlapCheck(slots, date, LocalTime.of(8, 0), LocalTime.of(12, 0), duration, bufferAfter, template, existingSlots);
            addSlotsWithOverlapCheck(slots, date, LocalTime.of(14, 0), LocalTime.of(18, 0), duration, bufferAfter, template, existingSlots);
        }
    }

    private void addSlotsWithOverlapCheck(List<AvailabilitySlotEntity> slots, LocalDate date, LocalTime start, LocalTime end, int duration, int bufferAfter, AvailabilityTemplateEntity template, List<AvailabilitySlotEntity> existingSlots) {
        LocalTime current = start;
        while (current.plusMinutes(duration).isBefore(end) || current.plusMinutes(duration).equals(end)) {
            LocalDateTime slotStart = LocalDateTime.of(date, current);
            LocalDateTime slotEnd = LocalDateTime.of(date, current.plusMinutes(duration));

            // Check if this slot overlaps with ANY existing slot for this user
            boolean overlaps = existingSlots.stream().anyMatch(existing -> 
                (slotStart.isBefore(existing.getEndTime()) && slotEnd.isAfter(existing.getStartTime()))
            );

            if (!overlaps) {
                slots.add(AvailabilitySlotEntity.builder()
                        .tenantId(template.getTenantId())
                        .companyId(template.getCompanyId())
                        .userId(template.getUserId())
                        .templateId(template.getId())
                        .serviceId(template.getServiceId())
                        .startTime(slotStart)
                        .endTime(slotEnd)
                        .status(EventStatus.AVAILABLE)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build());
            }
            current = current.plusMinutes(duration + bufferAfter);
        }
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Could not parse JSON Map: {}", e.getMessage());
            return Map.of();
        }
    }

    private List<Map<String, Object>> parseJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.warn("Could not parse JSON List: {}", e.getMessage());
            return List.of();
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

    // ── Service-based availability (grouped by provider) ──────────────

    public Mono<ServiceAvailabilityDto> getSlotsByService(Long tenantId, Long companyId, Long serviceId, LocalDateTime start, LocalDateTime end) {
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        return slotRepository.findAvailableByService(tenantId, companyId, serviceId, start, end)
                .collectList()
                .flatMap(slots -> {
                    if (slots.isEmpty()) {
                        return Mono.just(ServiceAvailabilityDto.builder()
                                .serviceId(serviceId)
                                .noSchedule(true)
                                .providers(List.of())
                                .build());
                    }

                    // Group slots by user_id
                    Map<Long, List<AvailabilitySlotEntity>> grouped = slots.stream()
                            .collect(Collectors.groupingBy(s -> s.getUserId() != null ? s.getUserId() : 0L));

                    // Resolve provider names and build response
                    List<Mono<ServiceAvailabilityDto.ProviderAvailability>> providerMonos = new ArrayList<>();

                    for (Map.Entry<Long, List<AvailabilitySlotEntity>> entry : grouped.entrySet()) {
                        Long userId = entry.getKey();
                        List<AvailabilitySlotEntity> userSlots = entry.getValue();

                        List<ServiceAvailabilityDto.SlotSummary> slotSummaries = userSlots.stream()
                                .map(s -> ServiceAvailabilityDto.SlotSummary.builder()
                                        .id(s.getId())
                                        .start(s.getStartTime().format(timeFmt))
                                        .end(s.getEndTime().format(timeFmt))
                                        .build())
                                .collect(Collectors.toList());

                        providerMonos.add(
                                resolveProviderName(userId)
                                        .map(name -> ServiceAvailabilityDto.ProviderAvailability.builder()
                                                .userId(userId)
                                                .providerName(name)
                                                .availableSlots(slotSummaries)
                                                .build())
                        );
                    }

                    return Flux.merge(providerMonos)
                            .collectList()
                            .map(providers -> ServiceAvailabilityDto.builder()
                                    .serviceId(serviceId)
                                    .noSchedule(false)
                                    .providers(providers)
                                    .build());
                });
    }

    private Mono<String> resolveProviderName(Long userId) {
        if (userId == null || userId == 0L) {
            return Mono.just("Sin asignar");
        }
        return userRepository.findById(userId)
                .flatMap(user -> {
                    if (user.getContactId() != null) {
                        return contactRepository.findById(user.getContactId())
                                .map(contact -> contact.getName() != null ? contact.getName() : buildUserName(user))
                                .defaultIfEmpty(buildUserName(user));
                    }
                    return Mono.just(buildUserName(user));
                })
                .defaultIfEmpty("Proveedor " + userId);
    }

    private String buildUserName(com.app.persistence.entity.UserEntity user) {
        String nombres = user.getNombres() != null ? user.getNombres() : "";
        String apellidos = user.getApellidos() != null ? user.getApellidos() : "";
        String full = (nombres + " " + apellidos).trim();
        return full.isEmpty() ? "Proveedor " + user.getId() : full;
    }
}
