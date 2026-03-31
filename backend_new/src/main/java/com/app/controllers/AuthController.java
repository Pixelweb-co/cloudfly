package com.app.controllers;

import com.app.dto.AuthRegisterRequest;
import com.app.dto.AuthResponse;
import com.app.dto.LoginRequest;
import com.app.dto.AvailabilityResponse;
import com.app.persistence.services.UserService;
import com.app.util.JwtProvider;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import com.app.dto.UserDto;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping
@CrossOrigin(origins = "*")
public class AuthController {

        private static final Logger log = LoggerFactory.getLogger(AuthController.class);
        private final ReactiveAuthenticationManager authenticationManager;
        private final JwtProvider jwtProvider;
        private final UserService userService;

        public AuthController(ReactiveAuthenticationManager authenticationManager, 
                              JwtProvider jwtProvider, 
                              UserService userService) {
                this.authenticationManager = authenticationManager;
                this.jwtProvider = jwtProvider;
                this.userService = userService;
        }

        @PostMapping({"/login", "/auth/login"})
        public Mono<AuthResponse> login(@RequestBody @Valid LoginRequest loginRequest) {
                return authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),
                                                loginRequest.getPassword()))
                                .flatMap(auth -> userService.findByUsername(loginRequest.getUsername())
                                                .flatMap(user -> userService.convertToDto(user))
                                                .map(userDto -> {
                                                        String token = jwtProvider.createToken(auth, userDto.getCustomerId(), userDto.getActiveCompanyId());
                                                        return AuthResponse.builder()
                                                                        .username(auth.getName())
                                                                        .message("Login exitoso")
                                                                        .jwt(token)
                                                                        .status(true)
                                                                        .user(userDto)
                                                                        .build();
                                                }));
        }

        @PostMapping({"/register", "/auth/register"})
        @ResponseStatus(HttpStatus.CREATED)
        public Mono<AuthResponse> register(@RequestBody @Valid AuthRegisterRequest registerRequest) {
                return ReactiveSecurityContextHolder.getContext()
                        .map(SecurityContext::getAuthentication)
                        .flatMap(auth -> {
                            List<String> requesterRoles = auth.getAuthorities().stream()
                                    .map(GrantedAuthority::getAuthority)
                                    .map(a -> a.replace("ROLE_", ""))
                                    .collect(Collectors.toList());
                            
                            boolean isAuthorizedToCreateUser = requesterRoles.contains("ADMIN") || requesterRoles.contains("MANAGER") || requesterRoles.contains("SUPERADMIN");
                            
                            if (registerRequest.getRoles() != null && registerRequest.getRoles().contains("USER") && !isAuthorizedToCreateUser) {
                                return Mono.just(AuthResponse.builder()
                                        .status(false)
                                        .message("El rol USER solo puede ser registrado por un administrador.")
                                        .build());
                            }
                            
                            return userService.registerUser(registerRequest)
                                    .flatMap(user -> userService.convertToDto(user))
                                    .map(userDto -> AuthResponse.builder()
                                            .username(userDto.getUsername())
                                            .message("Registro exitoso. Revise su email para verificar la cuenta.")
                                            .status(true)
                                            .user(userDto)
                                            .build());
                        })
                        .switchIfEmpty(Mono.defer(() -> {
                            // Public registration
                            if (registerRequest.getRoles() != null && registerRequest.getRoles().contains("USER")) {
                                return Mono.just(AuthResponse.builder()
                                        .status(false)
                                        .message("El rol USER solo puede ser registrado por un administrador.")
                                        .build());
                            }
                            
                            return userService.registerUser(registerRequest)
                                    .flatMap(user -> userService.convertToDto(user))
                                    .map(userDto -> AuthResponse.builder()
                                            .username(userDto.getUsername())
                                            .message("Registro exitoso. Revise su email para verificar la cuenta.")
                                            .status(true)
                                            .user(userDto)
                                            .build());
                        }));
        }

        @GetMapping({"/verify", "/auth/verify"})
        public Mono<AuthResponse> verify(@RequestParam String token) {
                return userService.verifyEmail(token)
                                .map(verified -> AuthResponse.builder()
                                                .message(verified ? "Email verificado con éxito"
                                                                 : "Token inválido o expirado")
                                                .status(verified)
                                                .build());
        }

        @PostMapping({"/validate-username", "/auth/validate-username"})
        public Mono<AvailabilityResponse> validateUsername(@RequestBody Map<String, String> request) {
                String username = request.get("username");
                return userService.checkUsernameAvailability(username)
                                .map(available -> AvailabilityResponse.builder()
                                                .isAvailable(available)
                                                .message(available ? "Nombre de usuario disponible"
                                                                 : "El nombre de usuario ya está en uso")
                                                .build());
        }

        @PostMapping({"/validate-email", "/auth/validate-email"})
        public Mono<AvailabilityResponse> validateEmail(@RequestBody Map<String, String> request) {
                String email = request.get("email");
                return userService.checkEmailAvailability(email)
                                .map(available -> AvailabilityResponse.builder()
                                                .isAvailable(available)
                                                .message(available ? "Correo electrónico disponible"
                                                                 : "El correo electrónico ya está en uso")
                                                .build());
        }

        @PostMapping({"/validate-account", "/auth/validate-account"})
        public Mono<Map<String, String>> validateAccount(@RequestBody Map<String, String> request) {
                String validationToken = request.get("validationToken");
                return userService.verifyEmail(validationToken)
                                .map(verified -> Map.of("Activado", verified ? "valid" : "invalid"));
        }

        @PostMapping({"/forgot-password", "/auth/forgot-password"})
        public Mono<org.springframework.http.ResponseEntity<String>> forgotPassword(@RequestParam String email) {
                log.info("📧 [AUTH-CONTROLLER] Method START: forgotPassword (RequestParam) - Email: {}", email);
                if (email == null || email.isEmpty()) {
                        return Mono.just(org.springframework.http.ResponseEntity.badRequest().body("Email no proporcionado."));
                }
                return userService.forgotPassword(email)
                                .then(Mono.defer(() -> {
                                        log.info("✅ [AUTH-CONTROLLER] Method SUCCESS: forgotPassword - Email: {}", email);
                                        return Mono.just(org.springframework.http.ResponseEntity.ok("Correo de restablecimiento enviado."));
                                }))
                                .onErrorResume(e -> {
                                        log.error("❌ [AUTH-CONTROLLER] Method ERROR: forgotPassword - Error: {}", e.getMessage());
                                        return Mono.just(org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage()));
                                });
        }

        @PostMapping({"/reset-password", "/auth/reset-password"})
        public Mono<org.springframework.http.ResponseEntity<String>> resetPassword(@RequestBody com.app.dto.ResetPasswordRequest request) {
                log.info("🔑 [AUTH-CONTROLLER] Method START: resetPassword - Token: {}", request != null ? request.getToken() : "NULL");
                if (request == null || request.getToken() == null || request.getNewPassword() == null) {
                        return Mono.just(org.springframework.http.ResponseEntity.badRequest().body("Token o contraseña no proporcionados."));
                }
                return userService.resetPassword(request.getToken(), request.getNewPassword())
                                .then(Mono.defer(() -> {
                                        log.info("✅ [AUTH-CONTROLLER] Method SUCCESS: resetPassword - Token: {}", request.getToken());
                                        return Mono.just(org.springframework.http.ResponseEntity.ok("Contraseña restablecida exitosamente."));
                                }))
                                .onErrorResume(e -> {
                                        log.error("❌ [AUTH-CONTROLLER] Method ERROR: resetPassword - Error: {}", e.getMessage());
                                        return Mono.just(org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage()));
                                });
        }

        @PostMapping({"/validate-token", "/auth/validate-token"})
        public Mono<org.springframework.http.ResponseEntity<Map<String, Object>>> validateToken(@RequestBody Map<String, String> request) {
                String token = request.get("token");
                if (token == null || token.isEmpty()) {
                        return Mono.just(org.springframework.http.ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Token no proporcionado.")));
                }
                try {
                        com.auth0.jwt.interfaces.DecodedJWT decodedJWT = jwtProvider.validateToken(token);
                        String username = jwtProvider.extractUsername(decodedJWT);
                        return Mono.just(org.springframework.http.ResponseEntity.ok(Map.of("valid", true, "username", username, "message", "Token válido.")));
                } catch (Exception e) {
                        return Mono.just(org.springframework.http.ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false, "message", "Token inválido: " + e.getMessage())));
                }
        }

        @GetMapping({"/session", "/auth/session"})
        public Mono<org.springframework.http.ResponseEntity<UserDto>> getSession() {
                return userService.getCurrentUser()
                                .flatMap(user -> userService.convertToDto(user))
                                .map(org.springframework.http.ResponseEntity::ok)
                                .defaultIfEmpty(org.springframework.http.ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
}
