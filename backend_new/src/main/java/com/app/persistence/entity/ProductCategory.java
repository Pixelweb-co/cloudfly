package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("product_categories")
public class ProductCategory {
    @Id
    private Long id;

    @Column("product_id")
    private Long productId;

    @Column("category_id")
    private Long categoryId;
}
