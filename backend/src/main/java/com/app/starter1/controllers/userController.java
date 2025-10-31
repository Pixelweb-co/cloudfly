package com.app.starter1.controllers;


import com.app.starter1.dto.UserCreateUpdateRequest;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.exeptions.UserNotFoundException;
import com.app.starter1.persistence.repository.UserRepository;
import com.app.starter1.persistence.services.UserDetailServiceAP;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class userController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserDetailServiceAP userDetailServiceAP;

    // Crear o actualizar un usuario
    @PostMapping("/save")
    public ResponseEntity<?> createOrUpdateUser(@RequestBody UserCreateUpdateRequest request) {
        try {
            // Llamar al servicio para crear o actualizar el usuario
            Map<String, Object> response = userDetailServiceAP.createOrUpdateUser(request);
            return ResponseEntity.ok(response); // Retorna la respuesta con el formato correcto
        } catch (IllegalArgumentException e) {
            // Retorna un error si alguna validación falla
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("result", "error", "message", e.getMessage()));
        } catch (Exception e) {
            // Retorna un error genérico en caso de cualquier otra excepción
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("result", "error", "message", "An error occurred while processing the request."));
        }
    }

    // Obtener todos los usuarios
    @GetMapping
    @Transactional
    public ResponseEntity<List<UserEntity>> getAllUsuarios() {
        Iterable<UserEntity> usuarios = userRepository.findAll();
        return ResponseEntity.ok((List<UserEntity>) usuarios);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            System.out.println(id);
            UserEntity user = userDetailServiceAP.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }
}
