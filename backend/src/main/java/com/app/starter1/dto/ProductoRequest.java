package com.app.starter1.dto;

import lombok.Data;

@Data
public class ProductoRequest {
    private String placement;
    private String location;
    private String periodicity;
    private String manual;
    private String warrantyEndDate;
    private String warrantyStartDate;
    private String supplier;
    private Integer bookValue;
    private String purchaseDate;
    private String amperage;
    private String frequency;
    private String power;
    private String voltage;
    private String origin;
    private String invimaRegister;
    private String status;
    private Long customer;
    private String classification;
    public String warranty;
    private String licensePlate;
    private String model;
    private String brand;
    private String productName;
    private String productCode;
    private Long typeDevice;
    private Boolean verification;
}

