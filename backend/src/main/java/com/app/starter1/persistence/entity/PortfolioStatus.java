package com.app.starter1.persistence.entity;

public enum PortfolioStatus {
    OPEN, // Pendiente / Abierta
    PARTIAL, // Pago Parcial
    PAID, // Pagado Totalmente
    OVERDUE, // Vencida (Calculado o Estado explícito)
    VOID // Anulada
}
