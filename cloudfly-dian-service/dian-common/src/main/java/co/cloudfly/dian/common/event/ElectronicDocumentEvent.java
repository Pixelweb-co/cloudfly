package co.cloudfly.dian.common.event;

import co.cloudfly.dian.common.enums.ElectronicDocumentOrigin;
import co.cloudfly.dian.common.enums.ElectronicDocumentType;
import co.cloudfly.dian.common.payload.ElectronicInvoicePayload;
import co.cloudfly.dian.common.payload.ElectronicPayrollPayload;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Evento principal para documentos electrónicos DIAN
 * Publicado por el ERP y consumido por el microservicio DIAN
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicDocumentEvent {

    /**
     * ID único del evento
     */
    @NotBlank(message = "Event ID is required")
    private String eventId;

    /**
     * Tipo de documento electrónico
     */
    @NotNull(message = "Document type is required")
    private ElectronicDocumentType documentType;

    /**
     * Origen del documento
     */
    @NotNull(message = "Origin is required")
    private ElectronicDocumentOrigin origin;

    /**
     * ID del tenant (empresa)
     */
    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    /**
     * ID de la compañía dentro del tenant
     */
    @NotNull(message = "Company ID is required")
    private Long companyId;

    /**
     * Sistema origen del documento
     */
    @NotBlank(message = "Source system is required")
    private String sourceSystem;

    /**
     * ID del documento en el sistema origen
     */
    @NotBlank(message = "Source document ID is required")
    private String sourceDocumentId;

    /**
     * Hint de ambiente (TEST o PRODUCTION)
     * Si no se especifica, se lee de la configuración DIAN del tenant
     */
    private String environmentHint;

    /**
     * Timestamp del evento
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    /**
     * Payload de factura/nota (solo si documentType es INVOICE, CREDIT_NOTE,
     * DEBIT_NOTE)
     */
    private ElectronicInvoicePayload invoice;

    /**
     * Payload de nómina (solo si documentType es PAYROLL)
     */
    private ElectronicPayrollPayload payroll;

    /**
     * Metadatos adicionales
     */
    private String metadata;

    /**
     * Valida que el payload correcto esté presente según el tipo de documento
     */
    public boolean isValid() {
        if (documentType == null)
            return false;

        switch (documentType) {
            case INVOICE:
            case CREDIT_NOTE:
            case DEBIT_NOTE:
                return invoice != null;
            case PAYROLL:
                return payroll != null;
            default:
                return false;
        }
    }
}
