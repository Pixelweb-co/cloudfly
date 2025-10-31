package com.app.starter1.dto;

import com.app.starter1.persistence.entity.Image;
import com.app.starter1.persistence.entity.Product;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ProductWithImageDTO {
    private Product product;

    @JsonCreator
    public ProductWithImageDTO(
            @JsonProperty("product") Product product) {
        this.product = product;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }
}
