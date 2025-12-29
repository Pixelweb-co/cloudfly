package co.cloudfly.erp.dian.api.dto;

import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * DTO para crear o actualizar una resolución DIAN
 */
public record DianResolutionRequest(

        @NotNull(message = "El ID de la compañía es requerido") Long companyId,

        @NotNull(message = "El tipo de documento es requerido") DianDocumentType documentType,

        @NotBlank(message = "El prefijo es requerido") @Size(max = 10, message = "El prefijo no puede exceder 10 caracteres") String prefix,

        @NotNull(message = "El rango inicial es requerido") @Min(value = 1, message = "El rango inicial debe ser mayor a 0") Long numberRangeFrom,

        @NotNull(message = "El rango final es requerido") @Min(value = 1, message = "El rango final debe ser mayor a 0") Long numberRangeTo,

        @NotBlank(message = "La clave técnica es requerida") @Size(max = 200, message = "La clave técnica no puede exceder 200 caracteres") String technicalKey,

        @Size(max = 50, message = "El número de resolución no puede exceder 50 caracteres") String resolutionNumber,

        @NotNull(message = "La fecha inicio de vigencia es requerida") @JsonFormat(pattern = "yyyy-MM-dd") LocalDate validFrom,

        @NotNull(message = "La fecha fin de vigencia es requerida") @JsonFormat(pattern = "yyyy-MM-dd") LocalDate validTo,

        Boolean active) {
    public DianResolutionRequest {
        if (active == null) {
            active = true;
        }

        // Validación: rangeTo debe ser mayor que rangeFrom
        if (numberRangeFrom != null && numberRangeTo != null && numberRangeTo < numberRangeFrom) {
            throw new IllegalArgumentException("El rango final debe ser mayor al rango inicial");
        }

        // Validación: validTo debe ser mayor que validFrom
        if (validFrom != null && validTo != null && validTo.isBefore(validFrom)) {
            throw new IllegalArgumentException("La fecha fin debe ser posterior a la fecha inicio");
        }
    }
}
