package com.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserCreateUpdateRequest {
    @NotBlank
    private String nombres;
    
    @NotBlank
    private String apellidos;
    
    @NotBlank
    private String username;
    
    @NotBlank
    @Email
    private String email;
    
    private String password;
    
    private String role;

    private Long avatarId;

    public UserCreateUpdateRequest() {}

    public UserCreateUpdateRequest(String nombres, String apellidos, String username, String email, String password, String role) {
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public Long getAvatarId() { return avatarId; }
    public void setAvatarId(Long avatarId) { this.avatarId = avatarId; }
}
