package com.app.controllers;

import com.app.dto.CalendarEventDto;
import com.app.services.CalendarEventService;
import lombok.RequiredArgsConstructor;
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
    public Mono<CalendarEventDto> create(@RequestBody CalendarEventDto dto) {
        return calendarEventService.createEvent(dto);
    }

    @GetMapping
    public Flux<CalendarEventDto> list(
            @RequestParam Long tenantId,
            @RequestParam Long companyId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now().plusMonths(1);
        
        return calendarEventService.listEvents(tenantId, companyId, start, end);
    }

    @GetMapping("/{id}")
    public Mono<CalendarEventDto> get(@PathVariable Long id) {
        return calendarEventService.getEvent(id);
    }
}
