package com.app.starter1.controllers;

import com.app.starter1.dto.hr.PayrollConceptDTO;
import com.app.starter1.services.PayrollConceptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/concepts")
@RequiredArgsConstructor
public class PayrollConceptController {

    private final PayrollConceptService conceptService;

    @GetMapping
    public ResponseEntity<List<PayrollConceptDTO>> getAllConcepts(
            @RequestParam Long customerId,
            @RequestParam(required = false) String type) {

        List<PayrollConceptDTO> concepts;
        if (type != null && !type.isEmpty()) {
            concepts = conceptService.getConceptsByType(customerId,
                    com.app.starter1.persistence.entity.PayrollConcept.ConceptType.valueOf(type));
        } else {
            concepts = conceptService.getAllConcepts(customerId);
        }

        return ResponseEntity.ok(concepts);
    }

    @PostMapping
    public ResponseEntity<PayrollConceptDTO> createConcept(
            @RequestBody PayrollConceptDTO dto,
            @RequestParam Long customerId) {
        PayrollConceptDTO created = conceptService.createConcept(dto, customerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/initialize")
    public ResponseEntity<Void> initializeDefaultConcepts(@RequestParam Long customerId) {
        conceptService.initializeDefaultConcepts(customerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayrollConceptDTO> getConceptById(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        PayrollConceptDTO concept = conceptService.getConceptById(id, customerId);
        return ResponseEntity.ok(concept);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PayrollConceptDTO> updateConcept(
            @PathVariable Long id,
            @RequestBody PayrollConceptDTO dto,
            @RequestParam Long customerId) {
        PayrollConceptDTO updated = conceptService.updateConcept(id, dto, customerId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConcept(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        conceptService.deleteConcept(id, customerId);
        return ResponseEntity.noContent().build();
    }
}
