package com.app.starter1.controllers;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.MessagePlatform;
import com.app.starter1.persistence.services.ChatService;
import com.app.starter1.utils.UserMethods;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserMethods userMethods;

    /**
     * GET /api/chat/contacts/{platform}
     * Obtener contactos agrupados por stage para una plataforma
     */
    @GetMapping("/contacts/{platform}")
    public ResponseEntity<ContactGroupDTO> getContactsByPlatform(
            @PathVariable String platform) {

        try {
            Long tenantId = userMethods.getTenantId();
            MessagePlatform messagePlatform = MessagePlatform.valueOf(platform.toUpperCase());

            ContactGroupDTO contacts = chatService.getContactsByPlatform(tenantId, messagePlatform);
            return ResponseEntity.ok(contacts);

        } catch (IllegalArgumentException e) {
            log.error("Invalid platform: {}", platform);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/chat/messages/{conversationId}
     * Obtener mensajes de una conversación con paginación
     */
    @GetMapping("/messages/{conversationId}")
    public ResponseEntity<Page<MessageDTO>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Long tenantId = userMethods.getTenantId();
        Page<MessageDTO> messages = chatService.getMessages(tenantId, conversationId, page, size);
        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/chat/messages
     * Guardar mensaje nuevo (llamado por Socket.IO microservice)
     */
    @PostMapping("/messages")
    public ResponseEntity<MessageDTO> saveMessage(
            @Valid @RequestBody MessageCreateRequest request) {

        // Validar que el tenantId del request coincida con el del usuario
        Long userTenantId = userMethods.getTenantId();
        if (!request.getTenantId().equals(userTenantId)) {
            log.warn("Tenant ID mismatch. User: {}, Request: {}", userTenantId, request.getTenantId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        MessageDTO savedMessage = chatService.saveMessage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
    }

    /**
     * POST /api/chat/send/{conversationId}
     * Enviar mensaje a través de Evolution API
     */
    @PostMapping("/send/{conversationId}")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody MessageCreateRequest request) {

        Long userTenantId = userMethods.getTenantId();
        if (!request.getTenantId().equals(userTenantId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        request.setConversationId(conversationId);
        MessageDTO sentMessage = chatService.sendToEvolution(conversationId, request);
        return ResponseEntity.ok(sentMessage);
    }

    /**
     * PATCH /api/chat/messages/read
     * Marcar mensajes como leídos
     */
    @PatchMapping("/messages/read")
    public ResponseEntity<Void> markAsRead(@RequestBody Map<String, List<Long>> payload) {
        List<Long> messageIds = payload.get("messageIds");

        if (messageIds == null || messageIds.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Long tenantId = userMethods.getTenantId();
        chatService.markAsRead(messageIds, tenantId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/chat/contacts/{contactId}/stage
     * Actualizar stage del contacto (drag & drop en Kanban)
     */
    @PatchMapping("/contacts/{contactId}/stage")
    public ResponseEntity<Void> updateContactStage(
            @PathVariable Long contactId,
            @RequestBody Map<String, String> payload) {

        String newStage = payload.get("stage");
        if (newStage == null) {
            return ResponseEntity.badRequest().build();
        }

        Long tenantId = userMethods.getTenantId();
        chatService.updateContactStage(contactId, tenantId, newStage);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/chat/typing
     * Actualizar estado de typing (opcional, solo para log)
     */
    @PostMapping("/typing")
    public ResponseEntity<Void> updateTyping(@RequestBody Map<String, Object> payload) {
        String conversationId = (String) payload.get("conversationId");
        Boolean isTyping = (Boolean) payload.get("isTyping");

        log.debug("Typing status update: conversation={}, isTyping={}", conversationId, isTyping);
        return ResponseEntity.ok().build();
    }
}
