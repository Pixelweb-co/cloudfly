package co.cloudfly.dian.core.application.dto;

import lombok.*;

/**
 * Respuesta de la API DIAN después de enviar un documento
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DianApiResponse {

    private boolean accepted;
    private String cufe; // CUFE para facturas, CUNE para nómina
    private String xmlResponse;
    private String errorCode;
    private String errorMessage;
    private String statusDescription;
}
