package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    private Long customerId;

    private Long orderId; // Referencia opcional al pedido

    @Column(nullable = false, unique = true)
    private String invoiceNumber; // Número fiscal

    @Column(nullable = false)
    private LocalDateTime issueDate; // Fecha emisión

    private LocalDateTime dueDate; // Fecha vencimiento

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal tax;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Column(length = 1000)
    private String notes;

    // Accounting Integration
    @Column(name = "contabilidad_generada")
    private Boolean accountingGenerated = false;

    @Column(name = "asiento_contable_id")
    private Long accountingVoucherId;

    // fields for DIAN
    @Column(name = "cufe")
    private String cufe;

    @Column(name = "qr_code", length = 1000)
    private String qrCode;

    @Column(name = "dian_status")
    private String dianStatus; // PENDING, SENT, ACCEPTED, REJECTED

    @Column(name = "dian_response", columnDefinition = "TEXT")
    private String dianResponse;

    @Column(name = "payment_means")
    private String paymentMeans; // 10=Efectivo, 41=Check, 42=Consignación...

    @Column(name = "payment_method")
    private String paymentMethod; // 1=Contado, 2=Crédito

    private Long createdBy;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
