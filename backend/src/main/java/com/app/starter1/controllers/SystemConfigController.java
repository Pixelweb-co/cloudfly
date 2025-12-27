package com.app.starter1.controllers;

import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.services.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller para gestionar la configuración del sistema
 * Solo accesible por SUPERADMIN
 */
@RestController
@RequestMapping("/api/system/config")
@RequiredArgsConstructor
@Slf4j
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    /**
     * Obtener configuración del sistema
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<SystemConfigDTO> getSystemConfig() {
        log.info("📋 [API] GET /api/system/config");
        SystemConfigDTO config = systemConfigService.getSystemConfig();
        return ResponseEntity.ok(config);
    }

    /**
     * Actualizar configuración del sistema
     */
    @PutMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<SystemConfigDTO> updateSystemConfig(@RequestBody SystemConfigDTO dto) {
        log.info("⚙️ [API] PUT /api/system/config");
        SystemConfigDTO updated = systemConfigService.updateSystemConfig(dto);
        return ResponseEntity.ok(updated);
    }
}
