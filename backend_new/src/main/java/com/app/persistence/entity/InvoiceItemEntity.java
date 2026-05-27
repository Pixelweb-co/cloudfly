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
@Table("invoice_items")
public class InvoiceItemEntity {

    @Id
    private Long id;

    @Column("invoice_id")
    private Long invoiceId;

    @Column("product_id")
    private Long productId;

    @Column("product_name")
    private String productName;

    private Integer quantity;

    @Column("unit_price")
    private BigDecimal unitPrice;

    private BigDecimal discount;

    private BigDecimal tax;

    private BigDecimal total;

    @Column("created_at")
    private LocalDateTime createdAt;
}
