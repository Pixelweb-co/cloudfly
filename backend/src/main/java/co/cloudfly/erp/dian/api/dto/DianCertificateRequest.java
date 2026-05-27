package co.cloudfly.erp.dian.api.dto;

import co.cloudfly.erp.dian.domain.enums.CertificateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO para subir un certificado DIAN
 * Se usa con multipart/form-data
 */
public record DianCertificateRequest(

        @NotNull(message = "El ID de la compañía es requerido") Long companyId,

        @NotBlank(message = "El alias es requerido") @Size(max = 100, message = "El alias no puede exceder 100 caracteres") String alias,

        @NotNull(message = "El tipo de certificado es requerido") CertificateType type,

        @NotBlank(message = "La contraseña es requerida") String password,

        Boolean active) {
    public DianCertificateRequest {
        if (active == null) {
            active = true;
        }
    }
}
