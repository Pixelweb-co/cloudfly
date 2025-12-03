package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponseDTO {

    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private String barcode;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal discount;
    private BigDecimal subtotal;
}
