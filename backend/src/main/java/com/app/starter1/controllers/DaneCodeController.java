package com.app.starter1.controllers;

import com.app.starter1.dto.DaneCodeDTO;
import com.app.starter1.services.DaneCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for DANE geographic codes (Departamentos y Ciudades de
 * Colombia)
 */
@RestController
@RequestMapping("/api/settings/dane")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DaneCodeController {

    private final DaneCodeService service;

    /**
     * Get all DANE codes
     */
    @GetMapping
    public ResponseEntity<List<DaneCodeDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /**
     * Get all departments
     */
    @GetMapping("/departamentos")
    public ResponseEntity<List<DaneCodeDTO>> getDepartamentos() {
        return ResponseEntity.ok(service.getDepartamentos());
    }

    /**
     * Get cities by department code
     */
    @GetMapping("/ciudades/{codigoDepartamento}")
    public ResponseEntity<List<DaneCodeDTO>> getCiudadesByDepartamento(
            @PathVariable String codigoDepartamento) {
        return ResponseEntity.ok(service.getCiudadesByDepartamento(codigoDepartamento));
    }

    /**
     * Get DANE code by codigo
     */
    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<DaneCodeDTO> getByCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(service.getByCodigo(codigo));
    }

    /**
     * Create new DANE code
     */
    @PostMapping
    public ResponseEntity<DaneCodeDTO> create(@RequestBody DaneCodeDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    /**
     * Update DANE code
     */
    @PutMapping("/{id}")
    public ResponseEntity<DaneCodeDTO> update(
            @PathVariable Long id,
            @RequestBody DaneCodeDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    /**
     * Delete (deactivate) DANE code
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
