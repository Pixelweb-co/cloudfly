package co.cloudfly.dian.core.application.dto;

import lombok.*;

/**
 * Respuesta del ERP con configuración de modo de operación DIAN
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DianOperationModeResponse {

    private Long id;
    private Long tenantId;
    private Long companyId;
    private String documentType;
    private String environment; // TEST or PRODUCTION
    private String softwareId;
    private String pin;
    private String testSetId;
    private Boolean certificationProcess;
    private Boolean active;

    // Datos del certificado (vendrán de otro endpoint pero se agregan aquí por
    // conveniencia)
    private String certificatePath;
    private String certificatePassword;
}
