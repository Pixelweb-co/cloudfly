package com.app.starter1.dto;

import com.app.starter1.persistence.entity.QuoteStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuoteResponseDTO {
    private Long id;
    private Long tenantId;
    private Long customerId;
    private String customerName; // Opcional, si se enriquece
    private String quoteNumber;
    private LocalDateTime quoteDate;
    private LocalDateTime expirationDate;
    private QuoteStatus status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal total;
    private String notes;
    private String terms;
    private Long createdBy;
    private List<QuoteItemResponseDTO> items;

    @Data
    public static class QuoteItemResponseDTO {
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
