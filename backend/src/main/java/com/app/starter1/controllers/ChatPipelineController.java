package com.app.starter1.controllers;

import com.app.starter1.dto.marketing.ConversationPipelineStateDTO;
import com.app.starter1.dto.marketing.MoveConversationRequest;
import com.app.starter1.services.ConversationPipelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversations/{conversationId}/pipeline")
@RequiredArgsConstructor
public class ChatPipelineController {

    private final ConversationPipelineService pipelineService;

    // TODO: Replace with proper tenant extraction logic from your security context
    private Long getTenantId(Authentication authentication) {
        return 1L; 
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MARKETING_READ')")
    public ResponseEntity<ConversationPipelineStateDTO> getState(
            @PathVariable String conversationId,
            Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return ResponseEntity.ok(pipelineService.getState(tenantId, conversationId));
    }

    @PostMapping("/assign/{pipelineId}/{stageId}")
    @PreAuthorize("hasAuthority('MARKETING_UPDATE')")
    public ResponseEntity<ConversationPipelineStateDTO> assignToPipeline(
            @PathVariable String conversationId,
            @PathVariable Long pipelineId,
            @PathVariable Long stageId,
            Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return ResponseEntity.ok(pipelineService.assignToPipeline(tenantId, conversationId, pipelineId, stageId));
    }

    @PatchMapping("/move")
    @PreAuthorize("hasAuthority('MARKETING_UPDATE')")
    public ResponseEntity<ConversationPipelineStateDTO> moveConversation(
            @PathVariable String conversationId,
            @RequestBody MoveConversationRequest request,
            Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return ResponseEntity.ok(pipelineService.moveConversation(tenantId, conversationId, request));
    }
}
