package com.cloudfly.pos.models.dto;

import com.cloudfly.pos.models.User;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AuthResponse {
    private String username;
    private String message;
    private String jwt;
    private boolean status;
    private User user;
}
