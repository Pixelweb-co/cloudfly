package com.app.controllers;

import com.app.dto.CalendarDto;
import com.app.services.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/calendars")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    public Flux<CalendarDto> list(@RequestParam Long tenantId, @RequestParam Long companyId) {
        return calendarService.listCalendars(tenantId, companyId);
    }

    @PostMapping
    public Mono<CalendarDto> create(@RequestBody CalendarDto dto) {
        return calendarService.createCalendar(dto);
    }

    @PutMapping("/{id}")
    public Mono<CalendarDto> update(@PathVariable Long id, @RequestBody CalendarDto dto) {
        return calendarService.updateCalendar(id, dto);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> delete(@PathVariable Long id) {
        return calendarService.deleteCalendar(id);
    }
}
