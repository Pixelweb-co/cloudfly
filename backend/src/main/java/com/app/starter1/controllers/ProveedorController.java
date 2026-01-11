package com.app.starter1.controllers;

import com.app.starter1.dto.*;
import com.app.starter1.services.ProveedorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para Proveedores
 */
@RestController
@RequestMapping("/api/v1/proveedores")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ProveedorController {

    private final ProveedorService service;

    /**
     * POST /api/v1/proveedores
     * Crear nuevo proveedor
     */
    @PostMapping
    public ResponseEntity<ProveedorResponse> crear(
            @Valid @RequestBody ProveedorRequest request,
            @RequestParam Long tenantId,
            Authentication authentication) {
        log.info("POST /proveedores - Tenant: {}", tenantId);

        String username = authentication != null ? authentication.getName() : "system";
        ProveedorResponse response = service.crear(request, tenantId, username);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/proveedores
     * Listar proveedores del tenant
     */
    @GetMapping
    public ResponseEntity<List<ProveedorResponse>> listar(
            @RequestParam Long tenantId,
            @RequestParam(required = false) Boolean soloActivos) {
        log.info("GET /proveedores - Tenant: {}, SoloActivos: {}", tenantId, soloActivos);

        List<ProveedorResponse> proveedores = service.listar(tenantId, soloActivos);
        return ResponseEntity.ok(proveedores);
    }

    /**
     * GET /api/v1/proveedores/{id}
     * Obtener proveedor por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProveedorResponse> buscarPorId(@PathVariable Long id) {
        log.info("GET /proveedores/{}", id);

        ProveedorResponse proveedor = service.buscarPorId(id);
        return ResponseEntity.ok(proveedor);
    }

    /**
     * GET /api/v1/proveedores/buscar-nit
     * Buscar proveedor por NIT
     */
    @GetMapping("/buscar-nit")
    public ResponseEntity<ProveedorResponse> buscarPorNit(
            @RequestParam Long tenantId,
            @RequestParam String numeroDocumento) {
        log.info("GET /proveedores/buscar-nit - NIT: {}", numeroDocumento);

        ProveedorResponse proveedor = service.buscarPorNit(tenantId, numeroDocumento);
        return ResponseEntity.ok(proveedor);
    }

    /**
     * GET /api/v1/proveedores/buscar-nombre
     * Buscar proveedores por nombre
     */
    @GetMapping("/buscar-nombre")
    public ResponseEntity<List<ProveedorResponse>> buscarPorNombre(
            @RequestParam Long tenantId,
            @RequestParam String razonSocial) {
        log.info("GET /proveedores/buscar-nombre - Nombre: {}", razonSocial);

        List<ProveedorResponse> proveedores = service.buscarPorNombre(tenantId, razonSocial);
        return ResponseEntity.ok(proveedores);
    }

    /**
     * PUT /api/v1/proveedores/{id}
     * Actualizar proveedor
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProveedorResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ProveedorRequest request) {
        log.info("PUT /proveedores/{}", id);

        ProveedorResponse proveedor = service.actualizar(id, request);
        return ResponseEntity.ok(proveedor);
    }

    /**
     * DELETE /api/v1/proveedores/{id}
     * Eliminar proveedor
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        log.info("DELETE /proveedores/{}", id);

        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
