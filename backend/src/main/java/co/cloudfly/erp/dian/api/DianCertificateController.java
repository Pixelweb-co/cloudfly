package co.cloudfly.erp.dian.api;

import co.cloudfly.erp.dian.api.dto.DianCertificateRequest;
import co.cloudfly.erp.dian.api.dto.DianCertificateResponse;
import co.cloudfly.erp.dian.service.DianCertificateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controlador REST para certificados DIAN
 */
@RestController
@RequestMapping("/api/settings/dian/certificates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class DianCertificateController {

    private final DianCertificateService service;
    private final ObjectMapper objectMapper;

    /**
     * Lista todos los certificados del tenant
     * GET /api/settings/dian/certificates?tenantId=1&companyId=1
     */
    @GetMapping
    public ResponseEntity<List<DianCertificateResponse>> list(
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long companyId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        List<DianCertificateResponse> certificates;
        if (companyId != null) {
            certificates = service.findByTenantAndCompany(effectiveTenantId, companyId);
        } else {
            certificates = service.findAllByTenant(effectiveTenantId);
        }

        return ResponseEntity.ok(certificates);
    }

    /**
     * Obtiene un certificado por ID
     * GET /api/settings/dian/certificates/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<DianCertificateResponse> getById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianCertificateResponse certificate = service.findById(id, effectiveTenantId);
        return ResponseEntity.ok(certificate);
    }

    /**
     * Sube un nuevo certificado
     * POST /api/settings/dian/certificates
     * Content-Type: multipart/form-data
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<DianCertificateResponse> upload(
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId,
            @RequestPart("file") MultipartFile file,
            @RequestPart("data") String requestJson) {

        try {
            Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

            if (effectiveTenantId == null) {
                return ResponseEntity.badRequest().build();
            }

            // Parsear JSON a objeto
            DianCertificateRequest request = objectMapper.readValue(requestJson, DianCertificateRequest.class);

            DianCertificateResponse created = service.uploadCertificate(
                    effectiveTenantId,
                    request,
                    file);

            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (Exception e) {
            log.error("Error procesando certificado", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Activa un certificado
     * PATCH /api/settings/dian/certificates/{id}/activate
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<DianCertificateResponse> activate(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianCertificateResponse activated = service.activate(id, effectiveTenantId);
        return ResponseEntity.ok(activated);
    }

    /**
     * Desactiva un certificado
     * PATCH /api/settings/dian/certificates/{id}/deactivate
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<DianCertificateResponse> deactivate(
            @PathVariable Long id,
            @RequestHeader(value = "X-Tenant-ID", required = false) Long headerTenantId,
            @RequestParam(required = false) Long tenantId) {

        Long effectiveTenantId = tenantId != null ? tenantId : headerTenantId;

        if (effectiveTenantId == null) {
            return ResponseEntity.badRequest().build();
        }

        DianCertificateResponse deactivated = service.deactivate(id, effectiveTenantId);
        return ResponseEntity.ok(deactivated);
    }

    /**
     * Elimina un certificado
     * DELETE /api/settings/dian/certificates/{id}
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
