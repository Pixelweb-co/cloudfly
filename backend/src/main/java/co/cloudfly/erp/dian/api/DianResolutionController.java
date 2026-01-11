package co.cloudfly.erp.dian.api;

import co.cloudfly.erp.dian.api.dto.DianResolutionRequest;
import co.cloudfly.erp.dian.api.dto.DianResolutionResponse;
import co.cloudfly.erp.dian.service.DianResolutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para resoluciones DIAN
 */
@RestController
@RequestMapping("/api/settings/dian/resolutions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class DianResolutionController {

    private final DianResolutionService service;

    /**
     * Lista todas las resoluciones del tenant
     * GET /api/settings/dian/resolutions?tenantId=1&companyId=1
     */
    @GetMapping
    public ResponseEntity<List<DianResolutionResponse>> list(
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long companyId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        List<DianResolutionResponse> resolutions;
        if (companyId != null) {
            resolutions = service.findByTenantAndCompany(effectiveTenantId, companyId);
        } else {
            resolutions = service.findAllByTenant(effectiveTenantId);
        }

        return ResponseEntity.ok(resolutions);
    }

    /**
     * Obtiene una resolución por ID
     * GET /api/settings/dian/resolutions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<DianResolutionResponse> getById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianResolutionResponse resolution = service.findById(id, effectiveTenantId);
        return ResponseEntity.ok(resolution);
    }

    /**
     * Crea una nueva resolución
     * POST /api/settings/dian/resolutions
     */
    @PostMapping
    public ResponseEntity<DianResolutionResponse> create(
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @Valid @RequestBody DianResolutionRequest request) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianResolutionResponse created = service.create(effectiveTenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Actualiza una resolución existente
     * PUT /api/settings/dian/resolutions/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<DianResolutionResponse> update(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @Valid @RequestBody DianResolutionRequest request) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianResolutionResponse updated = service.update(id, effectiveTenantId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Elimina una resolución
     * DELETE /api/settings/dian/resolutions/{id}
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
