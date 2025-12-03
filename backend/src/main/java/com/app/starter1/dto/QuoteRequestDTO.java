package com.app.starter1.dto;

import com.app.starter1.persistence.entity.QuoteStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuoteRequestDTO {
    private Long tenantId;
    private Long customerId;
    private LocalDateTime expirationDate;
    private QuoteStatus status;
    private String notes;
    private String terms;
    private BigDecimal discount;
    private BigDecimal tax;
    private List<QuoteItemRequestDTO> items;

    @Data
    public static class QuoteItemRequestDTO {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
    }
}
