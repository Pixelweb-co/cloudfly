package com.app.starter1.controllers;

import com.app.starter1.dto.*;
import com.app.starter1.services.NotaCreditoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para Notas de Crédito DIAN
 */
@RestController
@RequestMapping("/api/v1/notas-credito")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotaCreditoController {

    private final NotaCreditoService service;

    /**
     * POST /api/v1/notas-credito
     * Crear nueva nota de crédito
     */
    @PostMapping
    public ResponseEntity<NotaCreditoResponse> crear(
            @Valid @RequestBody NotaCreditoRequest request,
            @RequestParam Long tenantId,
            Authentication authentication) {
        log.info("POST /notas-credito - Tenant: {}", tenantId);

        String username = authentication != null ? authentication.getName() : "system";
        NotaCreditoResponse response = service.crear(request, tenantId, username);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/notas-credito
     * Listar notas de crédito del tenant
     */
    @GetMapping
    public ResponseEntity<List<NotaCreditoResponse>> listar(
            @RequestParam Long tenantId) {
        log.info("GET /notas-credito - Tenant: {}", tenantId);

        List<NotaCreditoResponse> notas = service.listar(tenantId);
        return ResponseEntity.ok(notas);
    }

    /**
     * GET /api/v1/notas-credito/{id}
     * Obtener nota de crédito por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotaCreditoResponse> buscarPorId(@PathVariable Long id) {
        log.info("GET /notas-credito/{}", id);

        NotaCreditoResponse nota = service.buscarPorId(id);
        return ResponseEntity.ok(nota);
    }

    /**
     * GET /api/v1/notas-credito/factura/{invoiceId}
     * Obtener notas de crédito de una factura
     */
    @GetMapping("/factura/{invoiceId}")
    public ResponseEntity<List<NotaCreditoResponse>> buscarPorFactura(
            @PathVariable Long invoiceId) {
        log.info("GET /notas-credito/factura/{}", invoiceId);

        List<NotaCreditoResponse> notas = service.buscarPorFactura(invoiceId);
        return ResponseEntity.ok(notas);
    }

    /**
     * POST /api/v1/notas-credito/{id}/aprobar
     * Aprobar nota de crédito (revierte contabilidad)
     */
    @PostMapping("/{id}/aprobar")
    public ResponseEntity<NotaCreditoResponse> aprobar(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("POST /notas-credito/{}/aprobar", id);

        String username = authentication != null ? authentication.getName() : "system";
        NotaCreditoResponse nota = service.aprobar(id, username);

        return ResponseEntity.ok(nota);
    }

    /**
     * POST /api/v1/notas-credito/{id}/enviar-dian
     * Enviar nota de crédito a DIAN
     */
    @PostMapping("/{id}/enviar-dian")
    public ResponseEntity<NotaCreditoResponse> enviarDian(@PathVariable Long id) {
        log.info("POST /notas-credito/{}/enviar-dian", id);

        NotaCreditoResponse nota = service.enviarDian(id);
        return ResponseEntity.ok(nota);
    }
}
