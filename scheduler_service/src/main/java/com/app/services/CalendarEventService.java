package com.app.services;

import com.app.dto.CalendarEventDto;
import com.app.events.CalendarEventCreated;
import com.app.events.CalendarEventUpdated;
import com.app.persistence.entity.CalendarEventEntity;
import com.app.persistence.entity.EventStatus;
import com.app.persistence.repository.CalendarEventRepository;
import com.app.persistence.repository.ScheduledJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final ScheduledJobRepository scheduledJobRepository;
    private final ApplicationEventPublisher eventPublisher;

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
                .allDay(dto.getAllDay())
                .relatedEntityType(dto.getRelatedEntityType())
                .relatedEntityId(dto.getRelatedEntityId())
                .campaignId(dto.getCampaignId())
                .payload(dto.getPayload())
                .recurrence(dto.getRecurrence())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return calendarEventRepository.save(entity)
                .doOnSuccess(saved -> eventPublisher.publishEvent(new CalendarEventCreated(saved)))
                .map(this::mapToDto);
    }

    public Flux<CalendarEventDto> listEvents(Long tenantId, Long companyId, LocalDateTime start, LocalDateTime end) {
        return calendarEventRepository.findByRange(tenantId, companyId, start, end)
                .map(this::mapToDto);
    }

    public Mono<CalendarEventDto> getEvent(Long id) {
        return calendarEventRepository.findById(id).map(this::mapToDto);
    }

    public Mono<CalendarEventDto> updateEvent(Long id, CalendarEventDto dto) {
        return calendarEventRepository.findById(id)
                .flatMap(entity -> {
                    entity.setTitle(dto.getTitle());
                    entity.setDescription(dto.getDescription());
                    entity.setStartTime(dto.getStartTime());
                    entity.setEndTime(dto.getEndTime());
                    entity.setAllDay(dto.getAllDay());
                    entity.setPayload(dto.getPayload());
                    entity.setRecurrence(dto.getRecurrence());
                    entity.setUpdatedAt(LocalDateTime.now());
                    return calendarEventRepository.save(entity);
                })
                .doOnSuccess(saved -> eventPublisher.publishEvent(new CalendarEventUpdated(saved)))
                .map(this::mapToDto);
    }

    public Mono<Void> deleteEvent(Long id) {
        return scheduledJobRepository.deleteByEventId(id)
                .then(calendarEventRepository.deleteById(id));
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
                .campaignId(entity.getCampaignId())
                .payload(entity.getPayload())
                .recurrence(entity.getRecurrence())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
