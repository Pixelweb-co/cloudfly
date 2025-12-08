package com.app.starter1.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatbotTypeConfigCreateRequest(
        @NotBlank(message = "El nombre del tipo de chatbot es requerido") String typeName,

        String description,

        @NotBlank(message = "La URL del webhook es requerida") String webhookUrl,

        Boolean status) {
}
