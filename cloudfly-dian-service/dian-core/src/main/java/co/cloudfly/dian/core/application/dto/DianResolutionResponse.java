package co.cloudfly.dian.core.application.dto;

import lombok.*;

/**
 * Respuesta del ERP con información de resolución DIAN
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DianResolutionResponse {

    private Long id;
    private Long tenantId;
    private Long companyId;
    private String documentType;
    private String prefix;
    private Long numberRangeFrom;
    private Long numberRangeTo;
    private Long currentNumber;
    private String technicalKey;
    private String resolutionNumber;
    private String validFrom; // LocalDate as String
    private String validTo;
    private Boolean active;
    private Long remainingNumbers;
}
