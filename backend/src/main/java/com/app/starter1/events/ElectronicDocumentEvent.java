package com.app.starter1.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElectronicDocumentEvent {

    private String documentId; // Internal ID (e.g. "123")
    private String documentNumber; // e.g. "DS-100"
    private String documentType; // INVOICE, CREDIT_NOTE, DEBIT_NOTE, SUPPORT_DOCUMENT
    private Long tenantId;
    private String environment; // 1=Prod, 2=Test

    private LocalDateTime issuedAt;

    // Payload extra (JSON content or references)
    private Map<String, Object> payload;
}
