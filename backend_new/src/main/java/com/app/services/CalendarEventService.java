package com.app.services;

import com.app.dto.CalendarEventDto;
import com.app.events.CalendarEventCreated;
import com.app.persistence.entity.CalendarEventEntity;
import com.app.persistence.entity.EventStatus;
import com.app.persistence.repository.CalendarEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Mono<CalendarEventDto> createEvent(CalendarEventDto dto) {
        CalendarEventEntity entity = CalendarEventEntity.builder()
                .tenantId(dto.getTenantId())
                .companyId(dto.getCompanyId())
                .calendarId(dto.getCalendarId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .eventType(dto.getEventType())
                .eventSubtype(dto.getEventSubtype())
                .status(EventStatus.SCHEDULED)
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .allDay(dto.getAllDay() != null ? dto.getAllDay() : false)
                .relatedEntityType(dto.getRelatedEntityType())
                .relatedEntityId(dto.getRelatedEntityId())
                .payload(dto.getPayload())
                .recurrence(dto.getRecurrence())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return calendarEventRepository.save(entity)
                .doOnSuccess(savedEntity -> eventPublisher.publishEvent(new CalendarEventCreated(this, savedEntity)))
                .map(this::mapToDto);
    }

    public Flux<CalendarEventDto> getEvents(Long tenantId, Long companyId, Long calendarId, 
                                            String eventType, String status, 
                                            LocalDateTime startDate, LocalDateTime endDate) {
        return calendarEventRepository.findWithFilters(tenantId, companyId, calendarId, eventType, status, startDate, endDate)
                .map(this::mapToDto);
    }

    public Mono<CalendarEventDto> getEvent(Long id, Long tenantId, Long companyId) {
        return calendarEventRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .map(this::mapToDto);
    }

    public Mono<CalendarEventDto> updateEvent(Long id, CalendarEventDto dto) {
        return calendarEventRepository.findByIdAndTenantIdAndCompanyId(id, dto.getTenantId(), dto.getCompanyId())
                .flatMap(entity -> {
                    entity.setTitle(dto.getTitle() != null ? dto.getTitle() : entity.getTitle());
                    entity.setDescription(dto.getDescription() != null ? dto.getDescription() : entity.getDescription());
                    entity.setStatus(dto.getStatus() != null ? dto.getStatus() : entity.getStatus());
                    entity.setStartTime(dto.getStartTime() != null ? dto.getStartTime() : entity.getStartTime());
                    entity.setEndTime(dto.getEndTime() != null ? dto.getEndTime() : entity.getEndTime());
                    entity.setUpdatedAt(LocalDateTime.now());
                    return calendarEventRepository.save(entity);
                })
                .map(this::mapToDto);
    }

    public Mono<Void> deleteEvent(Long id, Long tenantId, Long companyId) {
        return calendarEventRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(calendarEventRepository::delete);
    }

    private CalendarEventDto mapToDto(CalendarEventEntity entity) {
        return CalendarEventDto.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .companyId(entity.getCompanyId())
                .calendarId(entity.getCalendarId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .eventType(entity.getEventType())
                .eventSubtype(entity.getEventSubtype())
                .status(entity.getStatus())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .allDay(entity.getAllDay())
                .relatedEntityType(entity.getRelatedEntityType())
                .relatedEntityId(entity.getRelatedEntityId())
                .payload(entity.getPayload())
                .recurrence(entity.getRecurrence())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
