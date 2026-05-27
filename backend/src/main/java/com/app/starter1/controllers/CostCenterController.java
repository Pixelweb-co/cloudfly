package com.app.starter1.controllers;

import com.app.starter1.persistence.entity.CostCenter;
import com.app.starter1.persistence.services.CostCenterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller para Centros de Costo
 */
@RestController
@RequestMapping("/cost-centers")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONTADOR')")
public class CostCenterController {

    private final CostCenterService service;

    /**
     * Obtener todos los centros de costo activos
     */
    @GetMapping
    public ResponseEntity<List<CostCenter>> getAll() {
        log.info("GET /cost-centers - Fetching all active cost centers");
        return ResponseEntity.ok(service.getAllActive());
    }

    /**
     * Obtener centros de costo raíz
     */
    @GetMapping("/root")
    public ResponseEntity<List<CostCenter>> getRootCenters() {
        log.info("GET /cost-centers/root");
        return ResponseEntity.ok(service.getRootCenters());
    }

    /**
     * Obtener centros de costo hijos
     */
    @GetMapping("/children/{parentId}")
    public ResponseEntity<List<CostCenter>> getChildCenters(@PathVariable Long parentId) {
        log.info("GET /cost-centers/children/{}", parentId);
        return ResponseEntity.ok(service.getChildCenters(parentId));
    }

    /**
     * Obtener centro de costo por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CostCenter> getById(@PathVariable Long id) {
        log.info("GET /cost-centers/{}", id);
        return ResponseEntity.ok(service.getById(id));
    }

    /**
     * Crear nuevo centro de costo
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<CostCenter> create(@RequestBody CostCenter costCenter) {
        log.info("POST /cost-centers - Creating: {}", costCenter.getCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(costCenter));
    }

    /**
     * Actualizar centro de costo
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<CostCenter> update(@PathVariable Long id, @RequestBody CostCenter costCenter) {
        log.info("PUT /cost-centers/{}", id);
        return ResponseEntity.ok(service.update(id, costCenter));
    }

    /**
     * Eliminar (desactivar) centro de costo
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /cost-centers/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
