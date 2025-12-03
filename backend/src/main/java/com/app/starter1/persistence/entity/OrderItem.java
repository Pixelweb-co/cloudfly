package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Snapshot de datos del producto al momento de la venta
    @Column(nullable = false, length = 200, name = "product_name")
    private String productName;

    @Column(nullable = false, precision = 15, scale = 2, name = "unit_price")
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 15, scale = 2)
    private BigDecimal discount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(length = 100)
    private String sku;

    @Column(length = 100)
    private String barcode;

    // Helper method para calcular subtotal
    public void calculateSubtotal() {
        if (this.discount == null) {
            this.discount = BigDecimal.ZERO;
        }
        this.subtotal = this.unitPrice
                .multiply(BigDecimal.valueOf(this.quantity))
                .subtract(this.discount);
    }
}
