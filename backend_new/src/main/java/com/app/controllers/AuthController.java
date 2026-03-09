package com.app.controllers;

import com.app.dto.AuthRegisterRequest;
import com.app.dto.AuthResponse;
import com.app.dto.LoginRequest;
import com.app.dto.AvailabilityResponse;
import com.app.persistence.services.UserService;
import com.app.util.JwtProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

        private final ReactiveAuthenticationManager authenticationManager;
        private final JwtProvider jwtProvider;
        private final UserService userService;

        @PostMapping("/login")
        public Mono<AuthResponse> login(@RequestBody @Valid LoginRequest loginRequest) {
                return authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),
                                                loginRequest.getPassword()))
                                .map(auth -> {
                                        String token = jwtProvider.createToken(auth);
                                        return AuthResponse.builder()
                                                        .username(auth.getName())
                                                        .message("Login exitoso")
                                                        .jwt(token)
                                                        .status(true)
                                                        .build();
                                });
        }

        @PostMapping("/register")
        @ResponseStatus(HttpStatus.CREATED)
        public Mono<AuthResponse> register(@RequestBody @Valid AuthRegisterRequest registerRequest) {
                return userService.registerUser(registerRequest)
                                .map(user -> AuthResponse.builder()
                                                .username(user.getUsername())
                                                .message("Registro exitoso. Revise su email para verificar la cuenta.")
                                                .status(true)
                                                .build());
        }

        @GetMapping("/verify")
        public Mono<AuthResponse> verify(@RequestParam String token) {
                return userService.verifyEmail(token)
                                .map(verified -> AuthResponse.builder()
                                                .message(verified ? "Email verificado con éxito"
                                                                : "Token inválido o expirado")
                                                .status(verified)
                                                .build());
        }

        @PostMapping("/validate-account")
        public Mono<Map<String, String>> validateAccount(@RequestBody Map<String, String> request) {
                String validationToken = request.get("validationToken");
                return userService.verifyEmail(validationToken)
                                .map(verified -> Map.of("Activado", verified ? "valid" : "invalid"));
        }

        @PostMapping("/validate-username")
        public Mono<AvailabilityResponse> validateUsername(@RequestBody Map<String, String> request) {
                String username = request.get("username");
                return userService.checkUsernameAvailability(username)
                                .map(available -> AvailabilityResponse.builder()
                                                .isAvailable(available)
                                                .message(available ? "Nombre de usuario disponible"
                                                                : "El nombre de usuario ya está en uso")
                                                .build());
        }

        @PostMapping("/validate-email")
        public Mono<AvailabilityResponse> validateEmail(@RequestBody Map<String, String> request) {
                String email = request.get("email");
                return userService.checkEmailAvailability(email)
                                .map(available -> AvailabilityResponse.builder()
                                                .isAvailable(available)
                                                .message(available ? "Correo electrónico disponible"
                                                                : "El correo electrónico ya está en uso")
                                                .build());
        }
}
