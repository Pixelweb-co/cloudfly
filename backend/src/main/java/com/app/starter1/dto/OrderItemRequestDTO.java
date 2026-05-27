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
public class OrderItemRequestDTO {

    private Long productId;
    private Integer quantity;
    private BigDecimal discount; // Descuento específico para este item
}
