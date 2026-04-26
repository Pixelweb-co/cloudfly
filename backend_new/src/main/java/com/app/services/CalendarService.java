package com.app.services;

import com.app.dto.CalendarDto;
import com.app.persistence.entity.CalendarEntity;
import com.app.persistence.repository.CalendarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository calendarRepository;

    public Mono<CalendarDto> createCalendar(CalendarDto dto) {
        CalendarEntity entity = CalendarEntity.builder()
                .tenantId(dto.getTenantId())
                .companyId(dto.getCompanyId())
                .name(dto.getName())
                .color(dto.getColor())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .build();

        return calendarRepository.save(entity).map(this::mapToDto);
    }

    public Flux<CalendarDto> getCalendars(Long tenantId, Long companyId) {
        return calendarRepository.findByTenantIdAndCompanyId(tenantId, companyId)
                .map(this::mapToDto);
    }

    public Mono<CalendarDto> getCalendar(Long id, Long tenantId, Long companyId) {
        return calendarRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .map(this::mapToDto);
    }

    public Mono<CalendarDto> updateCalendar(Long id, CalendarDto dto) {
        return calendarRepository.findByIdAndTenantIdAndCompanyId(id, dto.getTenantId(), dto.getCompanyId())
                .flatMap(entity -> {
                    entity.setName(dto.getName() != null ? dto.getName() : entity.getName());
                    entity.setColor(dto.getColor() != null ? dto.getColor() : entity.getColor());
                    entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : entity.getIsActive());
                    return calendarRepository.save(entity);
                })
                .map(this::mapToDto);
    }

    public Mono<Void> deleteCalendar(Long id, Long tenantId, Long companyId) {
        return calendarRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(calendarRepository::delete);
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
