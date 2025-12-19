package com.app.starter1.controllers;

import com.app.starter1.dto.hr.PayrollNoveltyDTO;
import com.app.starter1.persistence.services.PayrollNoveltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr/novelties")
@RequiredArgsConstructor
public class PayrollNoveltyController {

    private final PayrollNoveltyService noveltyService;

    @GetMapping
    public ResponseEntity<Page<PayrollNoveltyDTO>> getAll(
            @RequestParam Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity
                .ok(noveltyService.getAll(customerId, PageRequest.of(page, size, Sort.by("date").descending())));
    }

    @PostMapping
    public ResponseEntity<PayrollNoveltyDTO> create(
            @RequestBody PayrollNoveltyDTO dto,
            @RequestParam Long customerId) {
        return ResponseEntity.ok(noveltyService.create(dto, customerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        noveltyService.delete(id, customerId);
        return ResponseEntity.ok().build();
    }
}
