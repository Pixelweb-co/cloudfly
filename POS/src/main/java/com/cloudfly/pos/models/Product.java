package com.cloudfly.pos.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    private Long id;
    private String name;
    private String description;
    private String code;
    private String barcode;
    private Double price;
    private Double cost;
    private Integer stock;
    private String category;
    private String imageUrl;
    private boolean active;

    // Campo calculado para el display
    public String getDisplayName() {
        return name + " - $" + String.format("%.2f", price);
    }
}
