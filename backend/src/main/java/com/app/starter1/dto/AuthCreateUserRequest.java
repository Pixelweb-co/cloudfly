package com.app.starter1.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public record AuthCreateUserRequest(@NotBlank String username,
                             @NotBlank String password,
                             @NotBlank String email,
                             @NotBlank String nombres,
                             @NotBlank String apellidos,
                             @Valid AuthCreateRoleRequest roleRequest)  {
}
