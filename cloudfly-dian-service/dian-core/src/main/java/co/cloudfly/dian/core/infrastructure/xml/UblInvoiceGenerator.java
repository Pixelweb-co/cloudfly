package co.cloudfly.dian.core.infrastructure.xml;

import co.cloudfly.dian.common.dto.*;
import co.cloudfly.dian.common.payload.ElectronicInvoicePayload;
import co.cloudfly.dian.core.application.dto.DianOperationModeResponse;
import co.cloudfly.dian.core.application.dto.DianResolutionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.UUID;

/**
 * Generador de XML UBL 2.1 para facturas electrónicas DIAN
 */
@Component
@Slf4j
public class UblInvoiceGenerator {

    private static final String UBL_VERSION = "UBL 2.1";
    private static final String CUSTOMIZATION_ID = "10";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    /**
     * Genera XML UBL 2.1 para factura/nota
     */
    public String generateInvoiceXml(
            ElectronicInvoicePayload payload,
            DianOperationModeResponse mode,
            DianResolutionResponse resolution) {

        log.info("Generating UBL XML for invoice: {}", payload.getExternalInvoiceNumber());

        try {
            StringBuilder xml = new StringBuilder();

            // Header XML
            xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            xml.append("<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\"\n");
            xml.append(
                    "         xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\"\n");
            xml.append("         xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\"\n");
            xml.append(
                    "         xmlns:ext=\"urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2\">\n");

            // Extensions (para firma)
            xml.append("  <ext:UBLExtensions>\n");
            xml.append("    <ext:UBLExtension>\n");
            xml.append("      <ext:ExtensionContent>\n");
            xml.append("        <!-- Firma digital se insertará aquí -->\n");
            xml.append("      </ext:ExtensionContent>\n");
            xml.append("    </ext:UBLExtension>\n");
            xml.append("  </ext:UBLExtensions>\n");

            // UBL Version
            xml.append("  <cbc:UBLVersionID>").append(UBL_VERSION).append("</cbc:UBLVersionID>\n");
            xml.append("  <cbc:CustomizationID>").append(CUSTOMIZATION_ID).append("</cbc:CustomizationID>\n");
            xml.append("  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>\n");

            // ID y UUID
            xml.append("  <cbc:ID>").append(escapeXml(payload.getExternalInvoiceNumber())).append("</cbc:ID>\n");

            String cufe = generateCufe(payload, resolution);
            xml.append("  <cbc:UUID schemeID=\"CUFE-SHA384\" schemeName=\"CUFE-SHA384\">")
                    .append(cufe).append("</cbc:UUID>\n");

            // Fechas
            xml.append("  <cbc:IssueDate>").append(payload.getIssueDate().format(DATE_FORMATTER))
                    .append("</cbc:IssueDate>\n");
            xml.append("  <cbc:IssueTime>").append(payload.getIssueTime().format(TIME_FORMATTER))
                    .append("</cbc:IssueTime>\n");

            // Tipo de documento
            xml.append("  <cbc:InvoiceTypeCode>").append(payload.getInvoiceTypeCode())
                    .append("</cbc:InvoiceTypeCode>\n");

            // Moneda
            xml.append("  <cbc:DocumentCurrencyCode>").append(payload.getCurrency())
                    .append("</cbc:DocumentCurrencyCode>\n");

            // Línea de referencia (orden de compra si existe)
            if (payload.getOrderReference() != null) {
                xml.append("  <cac:OrderReference>\n");
                xml.append("    <cbc:ID>").append(escapeXml(payload.getOrderReference())).append("</cbc:ID>\n");
                xml.append("  </cac:OrderReference>\n");
            }

            // Emisor (AccountingSupplierParty)
            appendParty(xml, "AccountingSupplierParty", payload.getIssuer());

            // Cliente (AccountingCustomerParty)
            appendParty(xml, "AccountingCustomerParty", payload.getCustomer());

            // Medios de pago
            if (payload.getPaymentMeans() != null) {
                for (PaymentDto payment : payload.getPaymentMeans()) {
                    xml.append("  <cac:PaymentMeans>\n");
                    xml.append("    <cbc:ID>").append(payment.getPaymentMeansCode()).append("</cbc:ID>\n");
                    xml.append("    <cbc:PaymentMeansCode>").append(payment.getPaymentMeansCode())
                            .append("</cbc:PaymentMeansCode>\n");
                    if (payment.getDueDate() != null) {
                        xml.append("    <cbc:PaymentDueDate>").append(payment.getDueDate().format(DATE_FORMATTER))
                                .append("</cbc:PaymentDueDate>\n");
                    }
                    xml.append("  </cac:PaymentMeans>\n");
                }
            }

            // Tax Total
            TotalsDto totals = payload.getTotals();
            xml.append("  <cac:TaxTotal>\n");
            xml.append("    <cbc:TaxAmount currencyID=\"").append(payload.getCurrency()).append("\">")
                    .append(formatAmount(totals.getTotalTaxAmount())).append("</cbc:TaxAmount>\n");
            xml.append("  </cac:TaxTotal>\n");

            // Legal Monetary Total
            xml.append("  <cac:LegalMonetaryTotal>\n");
            xml.append("    <cbc:LineExtensionAmount currencyID=\"").append(payload.getCurrency()).append("\">")
                    .append(formatAmount(totals.getLineExtensionAmount())).append("</cbc:LineExtensionAmount>\n");
            xml.append("    <cbc:TaxExclusiveAmount currencyID=\"").append(payload.getCurrency()).append("\">")
                    .append(formatAmount(totals.getTaxExclusiveAmount())).append("</cbc:TaxExclusiveAmount>\n");
            xml.append("    <cbc:TaxInclusiveAmount currencyID=\"").append(payload.getCurrency()).append("\">")
                    .append(formatAmount(totals.getTaxInclusiveAmount())).append("</cbc:TaxInclusiveAmount>\n");
            xml.append("    <cbc:PayableAmount currencyID=\"").append(payload.getCurrency()).append("\">")
                    .append(formatAmount(totals.getPayableAmount())).append("</cbc:PayableAmount>\n");
            xml.append("  </cac:LegalMonetaryTotal>\n");

            // Invoice Lines
            if (payload.getLines() != null) {
                for (LineDto line : payload.getLines()) {
                    appendInvoiceLine(xml, line, payload.getCurrency());
                }
            }

            xml.append("</Invoice>");

            String result = xml.toString();
            log.info("✅ UBL XML generated - Size: {} bytes", result.length());

            return result;

        } catch (Exception e) {
            log.error("❌ Error generating UBL XML", e);
            throw new RuntimeException("Failed to generate UBL XML", e);
        }
    }

    /**
     * Agrega un Party (emisor o receptor)
     */
    private void appendParty(StringBuilder xml, String partyType, PartyDto party) {
        xml.append("  <cac:").append(partyType).append(">\n");
        xml.append("    <cac:Party>\n");

        // Identificación
        xml.append("      <cac:PartyIdentification>\n");
        xml.append("        <cbc:ID schemeID=\"").append(party.getIdentificationType())
                .append("\" schemeName=\"").append(party.getIdentificationNumber()).append("\">")
                .append(party.getIdentificationNumber());
        if (party.getCheckDigit() != null) {
            xml.append(" checkDigit=\"").append(party.getCheckDigit()).append("\"");
        }
        xml.append("</cbc:ID>\n");
        xml.append("      </cac:PartyIdentification>\n");

        // Nombre
        xml.append("      <cac:PartyName>\n");
        xml.append("        <cbc:Name>").append(escapeXml(party.getLegalName())).append("</cbc:Name>\n");
        xml.append("      </cac:PartyName>\n");

        // Dirección
        if (party.getAddress() != null) {
            AddressDto addr = party.getAddress();
            xml.append("      <cac:PhysicalLocation>\n");
            xml.append("        <cac:Address>\n");
            xml.append("          <cbc:CityName>").append(escapeXml(addr.getCityName())).append("</cbc:CityName>\n");
            xml.append("          <cbc:CountrySubentity>").append(escapeXml(addr.getDepartmentName()))
                    .append("</cbc:CountrySubentity>\n");
            xml.append("          <cac:AddressLine>\n");
            xml.append("            <cbc:Line>").append(escapeXml(addr.getAddressLine())).append("</cbc:Line>\n");
            xml.append("          </cac:AddressLine>\n");
            xml.append("          <cac:Country>\n");
            xml.append("            <cbc:IdentificationCode>").append(addr.getCountryCode())
                    .append("</cbc:IdentificationCode>\n");
            xml.append("          </cac:Country>\n");
            xml.append("        </cac:Address>\n");
            xml.append("      </cac:PhysicalLocation>\n");
        }

        // Tax Scheme
        xml.append("      <cac:PartyTaxScheme>\n");
        xml.append("        <cac:TaxScheme>\n");
        xml.append("          <cbc:ID>").append(party.getTaxScheme()).append("</cbc:ID>\n");
        xml.append("        </cac:TaxScheme>\n");
        xml.append("      </cac:PartyTaxScheme>\n");

        // Contacto
        if (party.getEmail() != null || party.getTelephone() != null) {
            xml.append("      <cac:Contact>\n");
            if (party.getTelephone() != null) {
                xml.append("        <cbc:Telephone>").append(escapeXml(party.getTelephone()))
                        .append("</cbc:Telephone>\n");
            }
            if (party.getEmail() != null) {
                xml.append("        <cbc:ElectronicMail>").append(escapeXml(party.getEmail()))
                        .append("</cbc:ElectronicMail>\n");
            }
            xml.append("      </cac:Contact>\n");
        }

        xml.append("    </cac:Party>\n");
        xml.append("  </cac:").append(partyType).append(">\n");
    }

    /**
     * Agrega una línea de factura
     */
    private void appendInvoiceLine(StringBuilder xml, LineDto line, String currency) {
        xml.append("  <cac:InvoiceLine>\n");
        xml.append("    <cbc:ID>").append(line.getLineNumber()).append("</cbc:ID>\n");
        xml.append("    <cbc:InvoicedQuantity unitCode=\"").append(line.getUnitCode()).append("\">")
                .append(formatAmount(line.getQuantity())).append("</cbc:InvoicedQuantity>\n");
        xml.append("    <cbc:LineExtensionAmount currencyID=\"").append(currency).append("\">")
                .append(formatAmount(line.getLineExtensionAmount())).append("</cbc:LineExtensionAmount>\n");

        // Item
        xml.append("    <cac:Item>\n");
        xml.append("      <cbc:Description>").append(escapeXml(line.getDescription())).append("</cbc:Description>\n");
        if (line.getItemCode() != null) {
            xml.append("      <cac:StandardItemIdentification>\n");
            xml.append("        <cbc:ID>").append(escapeXml(line.getItemCode())).append("</cbc:ID>\n");
            xml.append("      </cac:StandardItemIdentification>\n");
        }
        xml.append("    </cac:Item>\n");

        // Precio
        xml.append("    <cac:Price>\n");
        xml.append("      <cbc:PriceAmount currencyID=\"").append(currency).append("\">")
                .append(formatAmount(line.getUnitPrice())).append("</cbc:PriceAmount>\n");
        xml.append("    </cac:Price>\n");

        xml.append("  </cac:InvoiceLine>\n");
    }

    /**
     * Genera el CUFE (código único de factura electrónica)
     */
    private String generateCufe(ElectronicInvoicePayload payload, DianResolutionResponse resolution) {
        try {
            // CUFE = SHA384(NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + ...)
            StringBuilder cufeString = new StringBuilder();
            cufeString.append(payload.getExternalInvoiceNumber());
            cufeString.append(payload.getIssueDate().format(DATE_FORMATTER));
            cufeString.append(payload.getIssueTime().format(TIME_FORMATTER));
            cufeString.append(formatAmount(payload.getTotals().getPayableAmount()));
            cufeString.append("01"); // Código impuesto
            cufeString.append(formatAmount(payload.getTotals().getTotalTaxAmount()));
            cufeString.append(payload.getIssuer().getIdentificationNumber());
            cufeString.append(payload.getCustomer().getIdentificationNumber());
            cufeString.append(resolution.getTechnicalKey());
            cufeString.append(payload.getEnvironment() != null ? payload.getEnvironment() : "1");

            MessageDigest digest = MessageDigest.getInstance("SHA-384");
            byte[] hash = digest.digest(cufeString.toString().getBytes());

            return bytesToHex(hash);

        } catch (Exception e) {
            log.warn("Error generating CUFE, using random UUID", e);
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    private String formatAmount(BigDecimal amount) {
        return amount != null ? amount.setScale(2, BigDecimal.ROUND_HALF_UP).toString() : "0.00";
    }

    private String escapeXml(String text) {
        if (text == null)
            return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
