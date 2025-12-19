package com.app.starter1.controllers;

import com.app.starter1.dto.hr.PayrollConfigurationDTO;
import com.app.starter1.services.PayrollConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador para la configuración de nómina
 */
@RestController
@RequestMapping("/api/hr/payroll/config")
@RequiredArgsConstructor
public class PayrollConfigurationController {

    private final PayrollConfigurationService configService;

    /**
     * Obtiene la configuración de nómina del tenant
     */
    @GetMapping
    public ResponseEntity<PayrollConfigurationDTO> getConfiguration(
            @RequestParam Long customerId) {
        PayrollConfigurationDTO config = configService.getConfiguration(customerId);
        return ResponseEntity.ok(config);
    }

    /**
     * Actualiza la configuración de nómina
     */
    @PutMapping
    public ResponseEntity<PayrollConfigurationDTO> updateConfiguration(
            @RequestParam Long customerId,
            @RequestBody PayrollConfigurationDTO dto) {
        PayrollConfigurationDTO updated = configService.updateConfiguration(customerId, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Restaura la configuración a valores por defecto
     */
    @PostMapping("/reset")
    public ResponseEntity<?> resetConfiguration(@RequestParam Long customerId) {
        PayrollConfigurationDTO config = configService.resetConfiguration(customerId);
        return ResponseEntity.ok(Map.of(
                "message", "Configuración restaurada a valores por defecto",
                "config", config));
    }
}
