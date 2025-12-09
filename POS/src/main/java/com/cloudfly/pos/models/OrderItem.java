package com.cloudfly.pos.models;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class OrderItem {
    private Product product;
    private int quantity;
    private double unitPrice;
    private double discount;

    public OrderItem(Product product, int quantity) {
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = product.getPrice();
        this.discount = 0.0;
    }

    public double getSubtotal() {
        return unitPrice * quantity;
    }

    public double getTotal() {
        return getSubtotal() - discount;
    }
}
