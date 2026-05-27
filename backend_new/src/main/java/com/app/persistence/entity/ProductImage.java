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
@Table("product_images")
public class ProductImage {
    @Id
    private Long id;

    @Column("product_id")
    private Long productId;

    @Column("media_id")
    private Long mediaId;
}
