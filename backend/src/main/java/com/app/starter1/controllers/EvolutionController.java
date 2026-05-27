package com.app.starter1.controllers;

import com.app.starter1.persistence.services.EvolutionApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/evolution")
@RequiredArgsConstructor
public class EvolutionController {

    private final EvolutionApiService evolutionApiService;

    @PostMapping("/instance/{instanceName}")
    public ResponseEntity<Map<String, Object>> createInstance(
            @PathVariable String instanceName,
            @RequestParam(value = "webhook", required = false) String webhook
    ) {
        log.info("🚀 [EVOLUTION] Creating instance: {}", instanceName);
        Map<String, Object> response = evolutionApiService.createInstance(instanceName, webhook);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/qr/{instanceName}")
    public ResponseEntity<Map<String, Object>> getQr(@PathVariable String instanceName) {
        log.info("🔲 [EVOLUTION] Fetching QR for instance: {}", instanceName);
        Map<String, Object> response = evolutionApiService.fetchQrCode(instanceName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{instanceName}")
    public ResponseEntity<Map<String, Object>> getStatus(@PathVariable String instanceName) {
        log.info("📊 [EVOLUTION] Getting status for instance: {}", instanceName);
        Map<String, Object> response = evolutionApiService.checkInstanceStatus(instanceName);
        return ResponseEntity.ok(response);
    }
}
