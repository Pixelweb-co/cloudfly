package com.app.starter1.dto;

import com.app.starter1.persistence.entity.PortfolioDocumentType;
import com.app.starter1.persistence.entity.PortfolioStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PortfolioDocumentDTO {
    private Long id;
    private Long tenantId;
    private Long contactId;
    private String contactName; // Para mostrar en lista

    private PortfolioDocumentType type;
    private String documentSource;
    private PortfolioStatus status;
    private String documentNumber;

    private LocalDateTime issueDate;
    private LocalDateTime dueDate;

    private BigDecimal totalAmount;
    private BigDecimal balance;

    private Long invoiceId;
    private String notes;
}
