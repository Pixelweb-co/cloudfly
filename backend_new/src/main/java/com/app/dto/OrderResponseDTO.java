package com.app.dto;

import com.app.persistence.entity.OrderStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponseDTO {
    private Long id;
    private Long tenantId;
    private Long companyId;
    private Long customerId;
    private String customerName;
    private String orderNumber;
    private LocalDateTime orderDate;
    private LocalDateTime expirationDate;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal total;
    private String notes;
    private String terms;
    private Long createdBy;
    private List<OrderItemResponseDTO> items;

    @Data
    public static class OrderItemResponseDTO {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal subtotal;
        private BigDecimal tax;
        private BigDecimal total;
    }
}
