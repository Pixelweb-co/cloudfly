package com.app.starter1.dto;

import com.app.starter1.persistence.entity.ContactType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContactRequestDTO {

    @NotBlank(message = "Name is required")
    private String name;

    private String email;

    private String phone;

    private String address;

    private String taxId;

    @NotNull(message = "Type is required")
    private ContactType type;

    @NotNull(message = "Tenant ID is required")
    private Integer tenantId;
}
