package com.cloudfly.pos.models.dto;

import com.cloudfly.pos.models.User;
import com.google.gson.annotations.SerializedName;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AuthResponse {
    private String username;
    private String message;
    private String jwt;
    private boolean status;

    // El backend retorna "userEntity", lo mapeamos a "user"
    @SerializedName("userEntity")
    private User user;
}
