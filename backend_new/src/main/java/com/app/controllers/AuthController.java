package com.app.controllers;

import com.app.dto.AuthRegisterRequest;
import com.app.dto.AuthResponse;
import com.app.dto.LoginRequest;
import com.app.persistence.services.UserService;
import com.app.util.JwtProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

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
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()))
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
                        .message(verified ? "Email verificado con éxito" : "Token inválido o expirado")
                        .status(verified)
                        .build());
    }
}
