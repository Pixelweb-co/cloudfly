package com.notification.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingNotificationMessage {
    private Long tenantId;
    private Long invoiceId;
    private String customerEmail;
    private String customerPhone;
    private String customerName;
    private String invoiceNumber;
    private String pdfUrl;
    private Double amount;
    private String currency;
    private String dueDate;
    private String template;
}
