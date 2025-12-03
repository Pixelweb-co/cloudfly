package com.app.starter1.persistence.entity;

public enum QuoteStatus {
    DRAFT, // Borrador
    SENT, // Enviada
    ACCEPTED, // Aceptada (convertida a pedido)
    REJECTED, // Rechazada
    EXPIRED // Vencida
}
