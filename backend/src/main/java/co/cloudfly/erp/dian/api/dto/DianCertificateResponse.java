package co.cloudfly.erp.dian.api.dto;

import co.cloudfly.erp.dian.domain.enums.CertificateType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para certificado DIAN
 * NO expone la contraseña ni la ruta completa del archivo
 */
public record DianCertificateResponse(
        Long id,
        Long tenantId,
        Long companyId,
        String alias,
        CertificateType type,
        String issuer,
        String subject,
        String serialNumber,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime validFrom,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime validTo,

        Boolean active,
        Boolean isValid, // calculado: si está dentro de la vigencia

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdAt,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime updatedAt) {
}
