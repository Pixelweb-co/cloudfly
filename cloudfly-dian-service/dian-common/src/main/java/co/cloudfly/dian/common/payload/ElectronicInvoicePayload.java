package co.cloudfly.dian.common.payload;

import co.cloudfly.dian.common.dto.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Payload para factura electrónica / notas
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicInvoicePayload {

    // Identificación del documento
    private String internalInvoiceNumber;
    private String externalInvoiceNumber; // Número que se mostrará públicamente
    private LocalDate issueDate;
    private LocalTime issueTime;

    // Tipo y clasificación
    private String invoiceTypeCode; // 01=Factura, 91=Nota Crédito, 92=Nota Débito
    private String documentSubtype;
    private String operationType; // 10=Estándar, 20=AIU, etc.

    // Moneda
    private String currency; // COP

    // Partes
    private PartyDto issuer; // Emisor
    private PartyDto customer; // Cliente/Receptor

    // Líneas de items
    private List<LineDto> lines;

    // Totales
    private TotalsDto totals;

    // Pago
    private List<PaymentDto> paymentMeans;

    // Referencias (para notas crédito/débito)
    private List<ReferenceDto> references;

    // Observaciones
    private String notes;

    // Datos adicionales
    private String orderReference;
    private String deliveryTerms;
    private String environment; // TEST or PRODUCTION
}
