package com.app.dto;

import com.app.persistence.entity.OrderStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderRequestDTO {
    private Long tenantId;
    private Long companyId;
    private Long customerId;
    private String customerName;
    private LocalDateTime orderDate;
    private LocalDateTime expirationDate;
    private OrderStatus status;
    private String notes;
    private String terms;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal total;
    private List<OrderItemRequestDTO> items;

    @Data
    public static class OrderItemRequestDTO {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal subtotal;
    }
}
