package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("payment_transactions")
public class PaymentTransactionEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("invoice_id")
    private Long invoiceId;

    @Column("transaction_id")
    private String transactionId;

    private BigDecimal amount;

    private String status;

    private String provider;

    @Column("payment_method_id")
    private Long paymentMethodId;

    @Column("response_payload")
    private String responsePayload; // Using String for simplicity, can be JsonNode with custom converter

    @Column("created_at")
    private LocalDateTime createdAt;
}
