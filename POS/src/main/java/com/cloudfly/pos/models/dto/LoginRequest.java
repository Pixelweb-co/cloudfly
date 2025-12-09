package com.cloudfly.pos.models.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class LoginRequest {
    private String username;
    private String password;
}
