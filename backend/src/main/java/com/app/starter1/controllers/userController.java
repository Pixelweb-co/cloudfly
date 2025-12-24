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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Collection;
import java.util.stream.Collectors;

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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("result", "error", "message", e.getMessage()));
        } catch (Exception e) {
            // Retorna un error genérico en caso de cualquier otra excepción
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("result", "error", "message", "An error occurred while processing the request."));
        }
    }

    // Obtener usuarios filtrados según el rol
    @GetMapping
    @Transactional
    public ResponseEntity<List<UserEntity>> getAllUsuarios(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
            }

            // Obtener username y authorities del Authentication (viene del JWT)
            String username = authentication.getName();
            Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

            // Verificar si es MANAGER o SUPERADMIN
            boolean isManager = authorities.stream()
                    .anyMatch(auth -> auth.getAuthority().contains("MANAGER") ||
                            auth.getAuthority().contains("SUPERADMIN"));

            List<UserEntity> usuarios;

            if (isManager) {
                // MANAGER/SUPERADMIN ve todos los usuarios
                usuarios = (List<UserEntity>) userRepository.findAll();
            } else {
                // Otros roles solo ven usuarios de su mismo customer
                UserEntity currentUser = userRepository.findUserEntityByUsername(username)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                if (currentUser.getCustomer() == null) {
                    // Si el usuario no tiene customer, retornar lista vacía
                    return ResponseEntity.ok(List.of());
                }

                // Filtrar usuarios por customer usando stream
                usuarios = ((List<UserEntity>) userRepository.findAll()).stream()
                        .filter(user -> user.getCustomer() != null &&
                                user.getCustomer().getId().equals(currentUser.getCustomer().getId()))
                        .collect(Collectors.toList());
            }

            return ResponseEntity.ok(usuarios);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
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
