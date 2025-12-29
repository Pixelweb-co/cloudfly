package co.cloudfly.erp.dian.api.dto;

import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import co.cloudfly.erp.dian.domain.enums.DianEnvironment;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para modo de operación DIAN
 */
public record DianOperationModeResponse(
        Long id,
        Long tenantId,
        Long companyId,
        DianDocumentType documentType,
        DianEnvironment environment,
        String softwareId,
        String pin,
        String testSetId,
        Boolean certificationProcess,
        Boolean active,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdAt,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime updatedAt) {
}
