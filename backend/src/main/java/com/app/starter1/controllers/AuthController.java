package com.app.starter1.controllers;


import com.app.starter1.dto.AuthCreateUserRequest;
import com.app.starter1.dto.AuthCreateUserRequest;
import com.app.starter1.dto.AuthResponse;
import com.app.starter1.dto.LoginRequest;
import com.app.starter1.persistence.repository.UserRepository;
import com.app.starter1.persistence.services.UserDetailServiceAP;
import com.app.starter1.persistence.services.VerificationTokenService;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.web.webauthn.api.AuthenticatorResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.ui.Model;

import java.util.HashMap;
import java.util.Map;
import com.app.starter1.util.JwtUtils;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtils jwtUtils;

    @Autowired
    private UserDetailServiceAP userDetailService;

    @Autowired
    private VerificationTokenService verificationTokenService;

    @Autowired
    private UserRepository userRepository;

    public AuthController(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest userRequest){

        return new ResponseEntity<>(userDetailService.loginUser(userRequest), HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid AuthCreateUserRequest authCreateUser) {
        try {
            return new ResponseEntity<>(userDetailService.createUser(authCreateUser), HttpStatus.CREATED);

        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (IllegalAccessException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @PostMapping("/validate-username")
    public ResponseEntity<Map<String, Boolean>> validateUsername(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        boolean isAvailable = !userRepository.existsByUsername(username);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isAvailable", isAvailable);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/validate-email")
    public ResponseEntity<Map<String, Boolean>> validateEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        boolean isAvailable = !userRepository.existsByEmail(email);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isAvailable", isAvailable);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/validate-account")
    public ResponseEntity<Map<String, String>> validateAccount(@RequestBody Map<String, String> request) {
        String vaidationToken = request.get("validationToken");
        String isAvailable = verificationTokenService.validateVerificationToken(vaidationToken);


        Map<String, String> response = new HashMap<>();
        response.put("Activado", isAvailable);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/validate-token")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        String token = request.get("token");
        if (token == null || token.isEmpty()) {
            response.put("valid", false);
            response.put("message", "El token no fue proporcionado.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        try {
            DecodedJWT decodedJWT = jwtUtils.validateToken(token);
            String username = jwtUtils.extractUsernameToken(decodedJWT);

            response.put("valid", true);
            response.put("username", username);
            response.put("message", "El token es válido.");
            return ResponseEntity.ok(response);

        } catch (JWTVerificationException e) {
            response.put("valid", false);
            response.put("message", "El token es inválido: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("valid", false);
            response.put("message", "Error al procesar el token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        userDetailService.resetPassword(request.get("token"), request.get("newPassword"));
        return ResponseEntity.ok("Contraseña restablecida exitosamente.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        userDetailService.sendResetPasswordEmail(request.get("email"));
        return ResponseEntity.ok("Correo de restablecimiento enviado.");
    }

}
