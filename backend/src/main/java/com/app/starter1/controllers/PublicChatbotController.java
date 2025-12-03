package com.app.starter1.controllers;

import com.app.starter1.dto.ChatbotConfigDTO;
import com.app.starter1.persistence.services.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/chatbot")
@RequiredArgsConstructor
public class PublicChatbotController {

    private final ChatbotService chatbotService;

    @GetMapping("/config")
    public ResponseEntity<ChatbotConfigDTO> getPublicConfig(@RequestParam String instance) {
        return ResponseEntity.ok(chatbotService.getPublicConfig(instance));
    }
}
