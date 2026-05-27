package com.app.starter1.controllers;

import com.app.starter1.persistence.services.MediaService;
import com.app.starter1.dto.MediaResponseDTO;
import com.app.starter1.dto.MediaUploadRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    // Subir varios archivos
    @PostMapping
    public ResponseEntity<List<MediaResponseDTO>> upload(
            @ModelAttribute MediaUploadRequestDTO request,      // tenantId, tag, etc.
            @RequestParam("files") List<MultipartFile> files    // campo 'files' en el FormData
    ) {
        List<MediaResponseDTO> result = mediaService.uploadFiles(request.getTenantId(), files);
        return ResponseEntity.ok(result);
    }

    // Listar biblioteca de medios por tenant
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<MediaResponseDTO>> listByTenant(@PathVariable Long tenantId) {
        return ResponseEntity.ok(mediaService.listByTenant(tenantId));
    }
}
