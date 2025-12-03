package com.app.starter1.dto;

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
public class ProductRequestDTO {

    private Long id;                // null para crear, valor para actualizar

    // opcional: si quieres que venga desde el front, si no lo calculas desde el token
    private Long tenantId;

    private String productName;
    private String description;

    private String productType;     // "0","1","2","3","4","5"

    private BigDecimal price;
    private BigDecimal salePrice;

    private String sku;
    private String barcode;

    private Boolean manageStock;
    private String inventoryStatus; // IN_STOCK, OUT_OF_STOCK, ON_BACKORDER
    private String allowBackorders; // NO, ALLOW, ALLOW_NOTIFY

    private Integer inventoryQty;

    private Boolean soldIndividually;

    private BigDecimal weight;
    private String dimensions;

    private String upsellProducts;
    private String crossSellProducts;

    private String status;          // ACTIVE, INACTIVE

    private String brand;
    private String model;

    // IDs que vienen del front
    private List<Long> categoryIds;
    private List<Long> imageIds;
}
