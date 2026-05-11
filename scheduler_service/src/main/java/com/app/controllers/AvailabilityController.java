package com.app.controllers;

import com.app.dto.AvailabilitySlotDto;
import com.app.persistence.entity.AvailabilitySlotEntity;
import com.app.persistence.entity.AvailabilityTemplateEntity;
import com.app.services.AvailabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
@Slf4j
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PostMapping("/templates")
    public Mono<AvailabilityTemplateEntity> createTemplate(@RequestBody AvailabilityTemplateEntity template) {
        return availabilityService.saveTemplate(template);
    }

    @PostMapping("/generate")
    public Mono<Void> generateSlots(@RequestParam Long templateId) {
        return availabilityService.generateSlots(templateId);
    }

    @GetMapping("/slots")
    public Flux<AvailabilitySlotDto> getSlots(
            @RequestParam Long tenantId,
            @RequestParam Long companyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return availabilityService.getSlots(tenantId, companyId, start, end);
    }

    @PatchMapping("/slots/{id}")
    public Mono<AvailabilitySlotEntity> updateSlot(@PathVariable Long id, @RequestBody AvailabilitySlotEntity slot) {
        // Simple update logic for now
        return Mono.empty(); // To be implemented if needed
    }

    @DeleteMapping("/slots/{id}")
    public Mono<Void> deleteSlot(@PathVariable Long id) {
        return Mono.empty(); // To be implemented if needed
    }
}
