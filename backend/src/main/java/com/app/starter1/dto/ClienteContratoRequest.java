package com.app.starter1.dto;

import lombok.Data;

@Data
public class ClienteContratoRequest {
    private Long id;
    private String name;
    private String nit;
    private String phone;
    private String email;
    private String address;
    private String contact;
    private String position;
    private String type;
    private String fechaInicio;
    private String fechaFinal;
    private String descripcionContrato;
    private Integer status; // 1 = Activo, 0 = Inactivo
}
