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
@Table("invoices")
public class InvoiceEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("customer_id")
    private Long customerId;

    @Column("public_url_token")
    private String publicUrlToken;

    @Column("subscription_id")
    private Long subscriptionId;

    @Column("invoice_number")
    private String invoiceNumber;

    @Column("issue_date")
    private LocalDateTime issueDate;

    @Column("due_date")
    private LocalDateTime dueDate;

    private String status;

    private BigDecimal subtotal;

    private BigDecimal tax;

    private BigDecimal total;

    private String currency;

    @Column("pdf_url")
    private String pdfUrl;

    @Column("billing_period_start")
    private LocalDateTime billingPeriodStart;

    @Column("billing_period_end")
    private LocalDateTime billingPeriodEnd;

    @Column("billing_type")
    private String billingType; // PAGO_UNICO, RECURRENTE

    @Column("billing_period")
    private String billingPeriod; // MENSUAL, SEMESTRAL, ANUAL

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
