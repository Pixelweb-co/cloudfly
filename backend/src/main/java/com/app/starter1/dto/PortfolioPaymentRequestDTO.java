package com.app.starter1.dto;

import com.app.starter1.persistence.entity.PortfolioPaymentType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PortfolioPaymentRequestDTO {
    private Long tenantId;
    private Long contactId;

    private PortfolioPaymentType type; // INCOMING, OUTGOING

    private BigDecimal amount;
    private LocalDateTime paymentDate;

    private String paymentMethod;
    private String reference;
    private String notes;

    // Opcional: Lista de cruces inmediatos (qué facturas paga)
    private List<ApplicationRequest> applications;

    @Data
    public static class ApplicationRequest {
        private Long documentId;
        private BigDecimal amount;
    }
}
