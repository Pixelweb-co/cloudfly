package com.app.starter1.dto;

import lombok.Data;

@Data
public class ClienteSinContratoRequest {
    private Long userId; // ID del usuario
    private ClienteForm form; // Datos del cliente
}