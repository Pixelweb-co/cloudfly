package com.app.starter1.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {

    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    private Long customerId; // Opcional

    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItemRequestDTO> items;

    @NotNull(message = "Payment method is required")
    private String paymentMethod; // CASH, CREDIT_CARD, DEBIT_CARD, TRANSFER

    private BigDecimal tax; // Impuesto opcional
    private BigDecimal discount; // Descuento a nivel de orden

    private Long createdBy; // Usuario que crea la orden
}
