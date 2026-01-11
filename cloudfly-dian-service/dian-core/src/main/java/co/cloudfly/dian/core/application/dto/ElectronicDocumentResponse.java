package co.cloudfly.dian.core.application.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para documentos electrónicos
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicDocumentResponse {

    private Long id;
    private String eventId;
    private String documentType;
    private String status;
    private Long tenantId;
    private Long companyId;
    private String sourceSystem;
    private String sourceDocumentId;
    private String dianDocumentNumber;
    private String cufeOrCune;
    private String environment;

    // XMLs en Base64
    private String xmlSigned;
    private String xmlResponse;

    private String errorCode;
    private String errorMessage;

    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
