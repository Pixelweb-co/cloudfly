package com.app.starter1.controllers;


import com.app.starter1.dto.SolicitudFirmaRequest;
import com.app.starter1.dto.UserRequest;
import com.app.starter1.persistence.entity.FirmaSolicitud;
import com.app.starter1.persistence.entity.FirmaSolicitud;
import com.app.starter1.persistence.repository.FirmaSolicitudRepository;
import com.app.starter1.persistence.repository.FirmaSolicitudRepository;
import com.app.starter1.persistence.services.SingStorageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.util.Optional;

@RestController
@RequestMapping("/firma-solicitud")
public class SignSolicitudController {

    @Autowired
    SingStorageService singStorageService;

    @Autowired
    FirmaSolicitudRepository firmaSolicitudRepository;

    @Autowired
    ObjectMapper objectMapper;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            // Cargar el archivo como recurso
            Resource file = singStorageService.LoadAsResource(filename);

            // Verificar si el archivo existe
            if (file == null || !file.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado: " + filename);
            }

            // Determinar el tipo de contenido
            String contentType = Files.probeContentType(file.getFile().toPath());
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            // Responder con el archivo y su tipo de contenido
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(file);

        } catch (NoSuchFileException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado: " + filename, e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al cargar el archivo: " + filename, e);
        }
    }

    @GetMapping("/sign/{id}")
    public ResponseEntity<Optional<FirmaSolicitud>> getFirmaUser(@PathVariable Long id) {

        Optional<FirmaSolicitud> firmaSolicitud = firmaSolicitudRepository.findByIdSolicitud(id);

        if (firmaSolicitud.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(firmaSolicitud);
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<FirmaSolicitud> saveFirma(
            @RequestPart("solicitud_id") String solicitudjson,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws JsonProcessingException {

        SolicitudFirmaRequest solicitudFirmaRequest = objectMapper.readValue(solicitudjson, SolicitudFirmaRequest.class);

        firmaSolicitudRepository.deleteByIdSolicitud(solicitudFirmaRequest.getId_solicitud());
        String path = singStorageService.Store(file);
        FirmaSolicitud firmaSolicitud = new FirmaSolicitud();
        System.out.println("id sol firma "+solicitudFirmaRequest.getId_solicitud().toString());
        firmaSolicitud.setFirma(path);
        firmaSolicitud.setIdSolicitud(solicitudFirmaRequest.getId_solicitud());
        FirmaSolicitud firmaSaved = firmaSolicitudRepository.save(firmaSolicitud);

        return ResponseEntity.ok(firmaSaved);

    }
}
