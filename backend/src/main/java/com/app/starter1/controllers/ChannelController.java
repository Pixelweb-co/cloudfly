package com.app.starter1.controllers;

import com.app.starter1.dto.ChannelCreateRequest;
import com.app.starter1.dto.ChannelDTO;
import com.app.starter1.services.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
@Slf4j
public class ChannelController {

    private final ChannelService channelService;

    /**
     * Obtener todos los canales del tenant
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChannelDTO>> getAllChannels() {
        log.info("GET /api/channels - Fetching all channels");
        return ResponseEntity.ok(channelService.getAllChannels());
    }

    /**
     * Obtener canales activos
     */
    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChannelDTO>> getActiveChannels() {
        log.info("GET /api/channels/active - Fetching active channels");
        return ResponseEntity.ok(channelService.getActiveChannels());
    }

    /**
     * Obtener canal por ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChannelDTO> getChannelById(@PathVariable Long id) {
        log.info("GET /api/channels/{} - Fetching channel", id);
        return ResponseEntity.ok(channelService.getChannelById(id));
    }

    /**
     * Crear nuevo canal
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ChannelDTO> createChannel(@Valid @RequestBody ChannelCreateRequest request) {
        log.info("POST /api/channels - Creating {} channel", request.type());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(channelService.createChannel(request));
    }

    /**
     * Actualizar canal
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ChannelDTO> updateChannel(
            @PathVariable Long id,
            @Valid @RequestBody ChannelCreateRequest request) {
        log.info("PUT /api/channels/{} - Updating channel", id);
        return ResponseEntity.ok(channelService.updateChannel(id, request));
    }

    /**
     * Activar/Desactivar canal
     */
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ChannelDTO> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/channels/{}/toggle - Toggling channel status", id);
        return ResponseEntity.ok(channelService.toggleActive(id));
    }

    /**
     * Actualizar estado de conexión (para uso interno/webhook)
     */
    @PatchMapping("/{id}/connection")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ChannelDTO> updateConnection(
            @PathVariable Long id,
            @RequestParam boolean isConnected,
            @RequestParam(required = false) String error) {
        log.info("PATCH /api/channels/{}/connection - Updating connection status", id);
        return ResponseEntity.ok(channelService.updateConnectionStatus(id, isConnected, error));
    }

    /**
     * Eliminar canal
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteChannel(@PathVariable Long id) {
        log.info("DELETE /api/channels/{} - Deleting channel", id);
        channelService.deleteChannel(id);
        return ResponseEntity.noContent().build();
    }
}
