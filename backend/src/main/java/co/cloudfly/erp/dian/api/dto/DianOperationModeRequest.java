package co.cloudfly.erp.dian.api.dto;

import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import co.cloudfly.erp.dian.domain.enums.DianEnvironment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO para crear o actualizar un modo de operación DIAN
 */
public record DianOperationModeRequest(

        @NotNull(message = "El ID de la compañía es requerido") Long companyId,

        @NotNull(message = "El tipo de documento es requerido") DianDocumentType documentType,

        @NotNull(message = "El ambiente es requerido") DianEnvironment environment,

        @NotBlank(message = "El Software ID es requerido") @Size(max = 100, message = "El Software ID no puede exceder 100 caracteres") String softwareId,

        @NotBlank(message = "El PIN es requerido") @Size(min = 4, max = 10, message = "El PIN debe tener entre 4 y 10 caracteres") String pin,

        @Size(max = 100, message = "El Test Set ID no puede exceder 100 caracteres") String testSetId,

        Boolean certificationProcess,

        Boolean active) {
    // Constructor compacto para valores por defecto
    public DianOperationModeRequest {
        if (certificationProcess == null) {
            certificationProcess = false;
        }
        if (active == null) {
            active = true;
        }
    }
}
