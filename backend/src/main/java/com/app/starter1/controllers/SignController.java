package com.app.starter1.controllers;



import com.app.starter1.dto.UserRequest;
import com.app.starter1.persistence.entity.FirmaSoporte;
import com.app.starter1.persistence.repository.FirmaSoporteRepository;
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
@RequestMapping("/firma-user")
public class SignController {

    @Autowired
    SingStorageService singStorageService;

    @Autowired
    FirmaSoporteRepository firmaSoporteRepository;

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
    public ResponseEntity<Optional<FirmaSoporte>> getFirmaUser(@PathVariable Long id) {

        Optional<FirmaSoporte> firmaSoporte = firmaSoporteRepository.findByIdUsuario(id);

        System.out.println(firmaSoporte);
        if (firmaSoporte.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(firmaSoporte);
    }


    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<FirmaSoporte> saveFirma(
            @RequestPart("user") String userJson,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws JsonProcessingException {

        UserRequest userRequest = objectMapper.readValue(userJson, UserRequest.class);

        //delete

        firmaSoporteRepository.deleteByIdUsuario(userRequest.getId());

        String path = singStorageService.Store(file);
        FirmaSoporte firmaSoporte = new FirmaSoporte();

        System.out.println("id usuario firma "+userRequest.getId().toString());

        firmaSoporte.setFirma(path);
        firmaSoporte.setIdUsuario(userRequest.getId());

        FirmaSoporte firmaSaved = firmaSoporteRepository.save(firmaSoporte);



        return ResponseEntity.ok(firmaSaved);


    }



}
