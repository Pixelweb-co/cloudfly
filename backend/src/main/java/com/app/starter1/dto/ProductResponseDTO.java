package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDTO {

    private Long id;
    private Long tenantId;

    private String productName;
    private String description;

    private String productType;

    private BigDecimal price;
    private BigDecimal salePrice;

    private String sku;
    private String barcode;

    private Boolean manageStock;
    private String inventoryStatus;
    private String allowBackorders;

    private Integer inventoryQty;

    private Boolean soldIndividually;

    private BigDecimal weight;
    private String dimensions;

    private String upsellProducts;
    private String crossSellProducts;

    private String status;

    private String brand;
    private String model;

    // Devolvemos los IDs para que el front sepa qué hay asociado
    private List<Long> categoryIds;
    private List<Long> imageIds;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
