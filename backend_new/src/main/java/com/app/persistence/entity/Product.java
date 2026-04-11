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
    @Column("id")
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("product_name")
    private String productName;

    @Column("description")
    private String description;

    @Column("product_type")
    private String productType;

    @Column("price")
    private BigDecimal price;

    @Column("sale_price")
    private BigDecimal salePrice;

    @Column("sku")
    private String sku;

    @Column("barcode")
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

    @Column("weight")
    private BigDecimal weight;

    @Column("dimensions")
    private String dimensions;

    @Column("upsell_products")
    private String upsellProducts;

    @Column("cross_sell_products")
    private String crossSellProducts;

    @Column("status")
    private String status;

    @Column("brand")
    private String brand;

    @Column("model")
    private String model;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
