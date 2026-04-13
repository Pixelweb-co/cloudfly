package com.app.starter1.dto;

import com.app.starter1.persistence.entity.ContactType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

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

    private String stage;
    private String avatarUrl;
    private String documentType;
    private String documentNumber;
    private String verificationDigit;
    private String businessName;
    private String tradeName;
    private String firstName;
    private String lastName;
    private String mobile;
    private String city;
    private String department;
    private String country;
    private String taxRegime;
    private Boolean isTaxResponsible;
    private Boolean isWithholdingAgent;
    private Boolean applyWithholdingTax;
    private Boolean applyVatWithholding;
    private Boolean applyIcaWithholding;
    private BigDecimal customWithholdingRate;
    private String defaultAccountCode;
    private Integer paymentTermsDays;
    private BigDecimal creditLimit;
    private Boolean isActive;
    
    // CRM Fields
    private Long pipelineId;
    private Long stageId;
}
