package com.app.services;

import com.app.dto.CalendarDto;
import com.app.persistence.entity.CalendarEntity;
import com.app.persistence.repository.CalendarEventRepository;
import com.app.persistence.repository.CalendarRepository;
import com.app.persistence.repository.ScheduledJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository calendarRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final ScheduledJobRepository scheduledJobRepository;

    public Flux<CalendarDto> listCalendars(Long tenantId, Long companyId) {
        return calendarRepository.findByTenantAndCompany(tenantId, companyId)
                .map(this::mapToDto);
    }

    public Mono<CalendarDto> createCalendar(CalendarDto dto) {
        CalendarEntity entity = CalendarEntity.builder()
                .tenantId(dto.getTenantId())
                .companyId(dto.getCompanyId())
                .name(dto.getName())
                .color(dto.getColor())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
        return calendarRepository.save(entity).map(this::mapToDto);
    }

    public Mono<CalendarDto> updateCalendar(Long id, CalendarDto dto) {
        return calendarRepository.findById(id)
                .flatMap(existing -> {
                    existing.setName(dto.getName());
                    existing.setColor(dto.getColor());
                    existing.setIsActive(dto.getIsActive());
                    return calendarRepository.save(existing);
                })
                .map(this::mapToDto);
    }

    public Mono<Void> deleteCalendar(Long id) {
        return scheduledJobRepository.deleteByCalendarId(id)
                .then(calendarEventRepository.deleteByCalendarId(id))
                .then(calendarRepository.deleteById(id));
    }

    private CalendarDto mapToDto(CalendarEntity entity) {
        return CalendarDto.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .companyId(entity.getCompanyId())
                .name(entity.getName())
                .color(entity.getColor())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
