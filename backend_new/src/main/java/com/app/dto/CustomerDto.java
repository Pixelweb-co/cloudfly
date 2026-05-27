package com.app.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerDto {
    private Long id;
    private String name;
    private String nit;
    private String phone;
    private String email;
    private String address;
    private String contact;
    private String position;
    private String type;
    private Boolean status;
    private String businessType;
    private String businessDescription;
}
