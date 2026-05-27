package com.app.starter1.controllers;

import com.app.starter1.dto.*;
import com.app.starter1.services.NotaDebitoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para Notas de Débito DIAN
 */
@RestController
@RequestMapping("/api/v1/notas-debito")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotaDebitoController {

    private final NotaDebitoService service;

    /**
     * POST /api/v1/notas-debito
     * Crear nueva nota de débito
     */
    @PostMapping
    public ResponseEntity<NotaDebitoResponse> crear(
            @Valid @RequestBody NotaDebitoRequest request,
            @RequestParam Long tenantId,
            Authentication authentication) {
        log.info("POST /notas-debito - Tenant: {}", tenantId);

        String username = authentication != null ? authentication.getName() : "system";
        NotaDebitoResponse response = service.crear(request, tenantId, username);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/v1/notas-debito
     * Listar notas de débito del tenant
     */
    @GetMapping
    public ResponseEntity<List<NotaDebitoResponse>> listar(
            @RequestParam Long tenantId) {
        log.info("GET /notas-debito - Tenant: {}", tenantId);

        List<NotaDebitoResponse> notas = service.listar(tenantId);
        return ResponseEntity.ok(notas);
    }

    /**
     * GET /api/v1/notas-debito/{id}
     * Obtener nota de débito por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotaDebitoResponse> buscarPorId(@PathVariable Long id) {
        log.info("GET /notas-debito/{}", id);

        NotaDebitoResponse nota = service.buscarPorId(id);
        return ResponseEntity.ok(nota);
    }

    /**
     * GET /api/v1/notas-debito/factura/{invoiceId}
     * Obtener notas de débito de una factura
     */
    @GetMapping("/factura/{invoiceId}")
    public ResponseEntity<List<NotaDebitoResponse>> buscarPorFactura(
            @PathVariable Long invoiceId) {
        log.info("GET /notas-debito/factura/{}", invoiceId);

        List<NotaDebitoResponse> notas = service.buscarPorFactura(invoiceId);
        return ResponseEntity.ok(notas);
    }

    /**
     * POST /api/v1/notas-debito/{id}/aprobar
     * Aprobar nota de débito (genera contabilidad)
     */
    @PostMapping("/{id}/aprobar")
    public ResponseEntity<NotaDebitoResponse> aprobar(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("POST /notas-debito/{}/aprobar", id);

        String username = authentication != null ? authentication.getName() : "system";
        NotaDebitoResponse nota = service.aprobar(id, username);

        return ResponseEntity.ok(nota);
    }

    /**
     * POST /api/v1/notas-debito/{id}/enviar-dian
     * Enviar nota de débito a DIAN
     */
    @PostMapping("/{id}/enviar-dian")
    public ResponseEntity<NotaDebitoResponse> enviarDian(@PathVariable Long id) {
        log.info("POST /notas-debito/{}/enviar-dian", id);

        NotaDebitoResponse nota = service.enviarDian(id);
        return ResponseEntity.ok(nota);
    }
}
