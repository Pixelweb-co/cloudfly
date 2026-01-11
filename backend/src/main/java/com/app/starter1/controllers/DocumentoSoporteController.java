package com.app.starter1.controllers;

import com.app.starter1.dto.DocumentoSoporteRequest;
import com.app.starter1.dto.DocumentoSoporteResponse;
import com.app.starter1.services.DocumentoSoporteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documentos-soporte")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DocumentoSoporteController {

    private final DocumentoSoporteService service;

    @PostMapping
    public ResponseEntity<DocumentoSoporteResponse> crear(
            @Valid @RequestBody DocumentoSoporteRequest request,
            @RequestParam Long tenantId,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(service.crear(request, tenantId, username));
    }

    @GetMapping
    public ResponseEntity<List<DocumentoSoporteResponse>> listar(@RequestParam Long tenantId) {
        return ResponseEntity.ok(service.listar(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentoSoporteResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping("/{id}/aprobar")
    public ResponseEntity<DocumentoSoporteResponse> aprobar(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(service.aprobar(id, username));
    }
}
