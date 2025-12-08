package com.app.starter1.controllers;

import com.app.starter1.dto.ChatbotTypeConfigCreateRequest;
import com.app.starter1.dto.ChatbotTypeConfigResponse;
import com.app.starter1.persistence.services.ChatbotTypeConfigService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chatbot-types")
@RequiredArgsConstructor
public class ChatbotTypeConfigController {

    private final ChatbotTypeConfigService service;

    @PostMapping
    public ResponseEntity<ChatbotTypeConfigResponse> createChatbotTypeConfig(
            @Valid @RequestBody ChatbotTypeConfigCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createChatbotTypeConfig(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatbotTypeConfigResponse> getChatbotTypeConfigById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getChatbotTypeConfigById(id));
    }

    @GetMapping("/by-name/{typeName}")
    public ResponseEntity<ChatbotTypeConfigResponse> getChatbotTypeConfigByName(@PathVariable String typeName) {
        return ResponseEntity.ok(service.getChatbotTypeConfigByName(typeName));
    }

    @GetMapping
    public ResponseEntity<List<ChatbotTypeConfigResponse>> getAllChatbotTypeConfigs() {
        return ResponseEntity.ok(service.getAllChatbotTypeConfigs());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ChatbotTypeConfigResponse>> getActiveChatbotTypeConfigs() {
        return ResponseEntity.ok(service.getActiveChatbotTypeConfigs());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChatbotTypeConfigResponse> updateChatbotTypeConfig(
            @PathVariable Long id,
            @Valid @RequestBody ChatbotTypeConfigCreateRequest request) {
        return ResponseEntity.ok(service.updateChatbotTypeConfig(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChatbotTypeConfig(@PathVariable Long id) {
        service.deleteChatbotTypeConfig(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ChatbotTypeConfigResponse> toggleChatbotTypeConfigStatus(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleChatbotTypeConfigStatus(id));
    }
}
