package com.app.starter1.dto;

import lombok.Data;

@Data
public class UserCreateUpdateRequest {
    private Long id;
    private String nombres;
    private String apellidos;
    private String username;
    private String password;
    private String confirmPassword;
    private String email;
    private String role; // El ID del rol
    private String customer; // ID del cliente relacionado
}