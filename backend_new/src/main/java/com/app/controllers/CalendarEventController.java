package com.app.controllers;

import com.app.dto.CalendarEventDto;
import com.app.services.CalendarEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @PostMapping
    public Mono<CalendarEventDto> createEvent(@RequestBody CalendarEventDto dto) {
        return calendarEventService.createEvent(dto);
    }

    @GetMapping
    public Flux<CalendarEventDto> getEvents(
            @RequestParam Long tenantId,
            @RequestParam Long companyId,
            @RequestParam(required = false) Long calendarId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return calendarEventService.getEvents(tenantId, companyId, calendarId, eventType, status, startDate, endDate);
    }

    @GetMapping("/{id}")
    public Mono<CalendarEventDto> getEvent(@PathVariable Long id, @RequestParam Long tenantId, @RequestParam Long companyId) {
        return calendarEventService.getEvent(id, tenantId, companyId);
    }

    @PutMapping("/{id}")
    public Mono<CalendarEventDto> updateEvent(@PathVariable Long id, @RequestBody CalendarEventDto dto) {
        return calendarEventService.updateEvent(id, dto);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> deleteEvent(@PathVariable Long id, @RequestParam Long tenantId, @RequestParam Long companyId) {
        return calendarEventService.deleteEvent(id, tenantId, companyId);
    }
}
