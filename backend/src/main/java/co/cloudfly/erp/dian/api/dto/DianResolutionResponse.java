package co.cloudfly.erp.dian.api.dto;

import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO de respuesta para resolución DIAN
 */
public record DianResolutionResponse(
        Long id,
        Long tenantId,
        Long companyId,
        DianDocumentType documentType,
        String prefix,
        Long numberRangeFrom,
        Long numberRangeTo,
        Long currentNumber,
        String technicalKey,
        String resolutionNumber,

        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate validFrom,

        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate validTo,

        Boolean active,
        Boolean isValid, // calculado: si está vigente
        Long remainingNumbers, // calculado: números disponibles

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdAt,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime updatedAt) {
}
