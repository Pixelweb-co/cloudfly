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

    @PostMapping
    public Mono<CalendarDto> createCalendar(@RequestBody CalendarDto dto) {
        return calendarService.createCalendar(dto);
    }

    @GetMapping
    public Flux<CalendarDto> getCalendars(@RequestParam Long tenantId, @RequestParam Long companyId) {
        return calendarService.getCalendars(tenantId, companyId);
    }

    @GetMapping("/{id}")
    public Mono<CalendarDto> getCalendar(@PathVariable Long id, @RequestParam Long tenantId, @RequestParam Long companyId) {
        return calendarService.getCalendar(id, tenantId, companyId);
    }

    @PutMapping("/{id}")
    public Mono<CalendarDto> updateCalendar(@PathVariable Long id, @RequestBody CalendarDto dto) {
        return calendarService.updateCalendar(id, dto);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> deleteCalendar(@PathVariable Long id, @RequestParam Long tenantId, @RequestParam Long companyId) {
        return calendarService.deleteCalendar(id, tenantId, companyId);
    }
}
