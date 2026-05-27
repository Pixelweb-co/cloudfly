package com.app.controllers;

import com.app.persistence.services.EvolutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/evolution")
@RequiredArgsConstructor
public class EvolutionController {

    private final EvolutionService evolutionService;

    @PostMapping("/instance/{name}")
    public Mono<Map<String, Object>> createInstance(@PathVariable String name) {
        return evolutionService.createInstance(name);
    }

    @GetMapping("/qr/{name}")
    public Mono<Map<String, Object>> getQr(@PathVariable String name) {
        return evolutionService.fetchQrCode(name);
    }

    @GetMapping("/status/{name}")
    public Mono<Map<String, Object>> getStatus(@PathVariable String name) {
        return evolutionService.checkConnection(name);
    }

    @PostMapping("/webhook/{name}")
    public Mono<Map<String, Object>> setWebhook(@PathVariable String name) {
        return evolutionService.setWebhook(name);
    }
}
