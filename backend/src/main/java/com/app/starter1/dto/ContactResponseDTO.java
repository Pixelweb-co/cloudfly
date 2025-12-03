package com.app.starter1.dto;

import com.app.starter1.persistence.entity.ContactType;
import lombok.Data;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
