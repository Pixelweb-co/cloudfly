package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("productos") // Nombre de la tabla en MySQL
public class Product {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("category_id")
    private Long categoryId;

    @Column("product_name")
    private String productName;

    private String description;

    @Column("product_type")
    private String productType;

    private BigDecimal price;

    @Column("sale_price")
    private BigDecimal salePrice;

    private String sku;

    private String barcode;

    @Column("manage_stock")
    private Boolean manageStock;

    @Column("inventory_status")
    private String inventoryStatus;

    @Column("allow_backorders")
    private String allowBackorders;

    @Column("inventory_qty")
    private Integer inventoryQty;

    @Column("sold_individually")
    private Boolean soldIndividually;

    private BigDecimal weight;

    private String dimensions;

    @Column("upsell_products")
    private String upsellProducts;

    @Column("cross_sell_products")
    private String crossSellProducts;

    private String status;

    private String brand;

    private String model;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
