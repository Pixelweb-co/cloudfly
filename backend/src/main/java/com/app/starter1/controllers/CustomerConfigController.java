package com.app.starter1.controllers;

import com.app.starter1.dto.CustomerConfigDTO;
import com.app.starter1.services.CustomerConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller para gestionar la configuración de integraciones del tenant
 */
@Slf4j
@RestController
@RequestMapping("/api/customer-config")
@RequiredArgsConstructor
public class CustomerConfigController {

    private final CustomerConfigService customerConfigService;

    /**
     * GET /api/customer-config
     * Obtener configuración del tenant actual
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerConfigDTO> getCustomerConfig() {
        log.info("📋 [CUSTOMER-CONFIG-API] Getting customer config");
        CustomerConfigDTO config = customerConfigService.getCustomerConfig();
        return ResponseEntity.ok(config);
    }

    /**
     * PUT /api/customer-config
     * Actualizar configuración del tenant
     */
    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerConfigDTO> updateCustomerConfig(@RequestBody CustomerConfigDTO dto) {
        log.info("⚙️ [CUSTOMER-CONFIG-API] Updating customer config");
        CustomerConfigDTO updated = customerConfigService.updateCustomerConfig(dto);
        return ResponseEntity.ok(updated);
    }
}
