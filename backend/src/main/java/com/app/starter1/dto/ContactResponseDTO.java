package com.app.starter1.dto;

import com.app.starter1.persistence.entity.ContactType;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ContactResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String taxId;
    private ContactType type;
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
    private BigDecimal currentBalance;
    private Boolean isActive;
    
    // CRM Fields
    private Long pipelineId;
    private Long stageId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
