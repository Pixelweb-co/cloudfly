package com.marketing.worker.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("productos")
public class Product {
    @Id
    private Long id;

    @Column("product_name")
    private String productName;

    private String description;
    private BigDecimal price;

    @Column("sale_price")
    private BigDecimal salePrice;
    
    private String sku;
}
