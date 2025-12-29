package co.cloudfly.erp.dian.api;

import co.cloudfly.erp.dian.api.dto.DianOperationModeRequest;
import co.cloudfly.erp.dian.api.dto.DianOperationModeResponse;
import co.cloudfly.erp.dian.service.DianOperationModeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para modos de operación DIAN
 */
@RestController
@RequestMapping("/api/settings/dian/operation-modes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class DianOperationModeController {

    private final DianOperationModeService service;

    /**
     * Lista todos los modos de operación del tenant
     * GET /api/settings/dian/operation-modes?tenantId=1&companyId=1
     */
    @GetMapping
    public ResponseEntity<List<DianOperationModeResponse>> list(
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long companyId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        List<DianOperationModeResponse> modes;
        if (companyId != null) {
            modes = service.findByTenantAndCompany(effectiveTenantId, companyId);
        } else {
            modes = service.findAllByTenant(effectiveTenantId);
        }

        return ResponseEntity.ok(modes);
    }

    /**
     * Obtiene un modo de operación por ID
     * GET /api/settings/dian/operation-modes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<DianOperationModeResponse> getById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianOperationModeResponse mode = service.findById(id, effectiveTenantId);
        return ResponseEntity.ok(mode);
    }

    /**
     * Crea un nuevo modo de operación
     * POST /api/settings/dian/operation-modes
     */
    @PostMapping
    public ResponseEntity<DianOperationModeResponse> create(
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @Valid @RequestBody DianOperationModeRequest request) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianOperationModeResponse created = service.create(effectiveTenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Actualiza un modo de operación existente
     * PUT /api/settings/dian/operation-modes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<DianOperationModeResponse> update(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @Valid @RequestBody DianOperationModeRequest request) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianOperationModeResponse updated = service.update(id, effectiveTenantId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Elimina un modo de operación
     * DELETE /api/settings/dian/operation-modes/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        service.delete(id, effectiveTenantId);
        return ResponseEntity.noContent().build();
    }
}
