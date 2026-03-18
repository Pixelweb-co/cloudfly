package com.app.starter1.controllers;

import com.app.starter1.dto.marketing.PipelineStageCreateRequest;
import com.app.starter1.dto.marketing.PipelineStageDTO;
import com.app.starter1.persistence.entity.PipelineStage;
import com.app.starter1.persistence.repository.PipelineStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pipelines/stages")
@RequiredArgsConstructor
public class PipelineStageController {

    private final PipelineStageRepository stageRepository;

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MARKETING_UPDATE')")
    public ResponseEntity<PipelineStageDTO> updateStage(@PathVariable Long id, @RequestBody PipelineStageCreateRequest request) {
        PipelineStage stage = stageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        if (request.getName() != null) stage.setName(request.getName());
        if (request.getDescription() != null) stage.setDescription(request.getDescription());
        if (request.getColor() != null) stage.setColor(request.getColor());
        if (request.getPosition() != null) stage.setPosition(request.getPosition());
        if (request.getOutcome() != null) stage.setOutcome(request.getOutcome());
        if (request.getTimeoutHours() != null) stage.setTimeoutHours(request.getTimeoutHours());

        PipelineStage saved = stageRepository.save(stage);

        PipelineStageDTO dto = new PipelineStageDTO();
        dto.setId(saved.getId());
        dto.setPipelineId(saved.getPipeline().getId());
        dto.setName(saved.getName());
        dto.setDescription(saved.getDescription());
        dto.setColor(saved.getColor());
        dto.setPosition(saved.getPosition());
        dto.setIsInitial(saved.getIsInitial());
        dto.setIsFinal(saved.getIsFinal());
        dto.setOutcome(saved.getOutcome());
        dto.setTimeoutHours(saved.getTimeoutHours());
        dto.setRotationEnabled(saved.getRotationEnabled());
        dto.setMaxConversations(saved.getMaxConversations());

        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MARKETING_DELETE')")
    public ResponseEntity<Void> deleteStage(@PathVariable Long id) {
        stageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
