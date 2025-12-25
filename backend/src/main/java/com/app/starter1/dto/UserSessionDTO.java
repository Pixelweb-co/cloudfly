package com.app.starter1.dto;

import java.util.List;

public record UserSessionDTO(
        Long id,
        String username,
        String email,
        String nombres,
        String apellidos,
        List<String> roles,
        Long customerId,
        Long tenantId) {
}
