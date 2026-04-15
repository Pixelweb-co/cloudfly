package com.app.persistence.entity;

public enum QuoteStatus {
    DRAFT,    // Borrador
    SENT,     // Enviada
    ACCEPTED, // Aceptada (convertida a pedido)
    REJECTED, // Rechazada
    EXPIRED   // Vencida
}
