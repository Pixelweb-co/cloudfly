package co.cloudfly.dian.core.infrastructure.xml;

import co.cloudfly.dian.common.dto.*;
import co.cloudfly.dian.common.payload.ElectronicPayrollPayload;
import co.cloudfly.dian.core.application.dto.DianOperationModeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Generador de XML para nómina electrónica DIAN
 */
@Component
@Slf4j
public class UblPayrollGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Genera XML de nómina electrónica
     */
    public String generatePayrollXml(
            ElectronicPayrollPayload payload,
            DianOperationModeResponse mode) {

        log.info("Generating payroll XML for: {}", payload.getPayrollReceiptId());

        try {
            StringBuilder xml = new StringBuilder();

            // Header XML
            xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            xml.append("<NominaIndividual xmlns=\"http://www.dian.gov.co/contratos/facturaelectronica/v1/nom\"\n");
            xml.append("                  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n");

            // General
            xml.append("  <General>\n");
            xml.append("    <Version>V1.0</Version>\n");
            xml.append("    <Moneda>").append("COP").append("</Moneda>\n");
            xml.append("    <TipoNomina>").append(payload.getPayrollType() != null ? payload.getPayrollType() : "102")
                    .append("</TipoNomina>\n");
            xml.append("    <Numero>").append(escapeXml(payload.getPayrollReceiptId())).append("</Numero>\n");
            xml.append("    <Secuencia>").append(escapeXml(payload.getPayrollSequence())).append("</Secuencia>\n");
            xml.append("    <FechaEmision>").append(payload.getIssueDate().format(DATE_FORMATTER))
                    .append("</FechaEmision>\n");
            xml.append("    <FechaInicio>").append(payload.getPeriod().getStartDate().format(DATE_FORMATTER))
                    .append("</FechaInicio>\n");
            xml.append("    <FechaFin>").append(payload.getPeriod().getEndDate().format(DATE_FORMATTER))
                    .append("</FechaFin>\n");
            xml.append("    <TiempoPago>").append(payload.getPeriod().getPeriodicity()).append("</TiempoPago>\n");

            // CUNE
            String cune = generateCune(payload);
            xml.append("    <CUNE>").append(cune).append("</CUNE>\n");

            xml.append("  </General>\n");

            // Empleador
            xml.append("  <Empleador>\n");
            PartyDto employer = payload.getEmployer();
            xml.append("    <RazonSocial>").append(escapeXml(employer.getLegalName())).append("</RazonSocial>\n");
            xml.append("    <TipoDocumento>").append(employer.getIdentificationType()).append("</TipoDocumento>\n");
            xml.append("    <NumeroDocumento>").append(employer.getIdentificationNumber())
                    .append("</NumeroDocumento>\n");
            if (employer.getCheckDigit() != null) {
                xml.append("    <DV>").append(employer.getCheckDigit()).append("</DV>\n");
            }
            if (employer.getAddress() != null) {
                xml.append("    <Ciudad>").append(escapeXml(employer.getAddress().getCityName())).append("</Ciudad>\n");
                xml.append("    <Direccion>").append(escapeXml(employer.getAddress().getAddressLine()))
                        .append("</Direccion>\n");
            }
            xml.append("  </Empleador>\n");

            // Trabajador (Empleado)
            xml.append("  <Trabajador>\n");
            EmployeePayrollDto employee = payload.getEmployee();
            xml.append("    <TipoTrabajador>01</TipoTrabajador>\n");
            xml.append("    <TipoDocumento>").append(employee.getIdentificationType()).append("</TipoDocumento>\n");
            xml.append("    <NumeroDocumento>").append(employee.getIdentificationNumber())
                    .append("</NumeroDocumento>\n");
            xml.append("    <PrimerApellido>").append(escapeXml(employee.getLastName())).append("</PrimerApellido>\n");
            xml.append("    <PrimerNombre>").append(escapeXml(employee.getFirstName())).append("</PrimerNombre>\n");
            xml.append("    <LugarTrabajo>\n");
            if (employer.getAddress() != null) {
                xml.append("      <MunicipioCiudad>").append(employer.getAddress().getCityCode())
                        .append("</MunicipioCiudad>\n");
            }
            xml.append("    </LugarTrabajo>\n");
            xml.append("    <TipoContrato>").append(employee.getContractType()).append("</TipoContrato>\n");
            xml.append("    <Sueldo>").append(formatAmount(employee.getSalary())).append("</Sueldo>\n");
            xml.append("  </Trabajador>\n");

            // Devengados
            if (payload.getEarnings() != null && !payload.getEarnings().isEmpty()) {
                xml.append("  <Devengados>\n");
                BigDecimal totalDevengados = BigDecimal.ZERO;

                for (PayrollEarningDto earning : payload.getEarnings()) {
                    totalDevengados = totalDevengados.add(earning.getAmount());
                }

                xml.append("    <Total>").append(formatAmount(totalDevengados)).append("</Total>\n");

                for (PayrollEarningDto earning : payload.getEarnings()) {
                    xml.append("    <").append(earning.getType()).append(">");
                    xml.append(formatAmount(earning.getAmount()));
                    xml.append("</").append(earning.getType()).append(">\n");
                }

                xml.append("  </Devengados>\n");
            }

            // Deducciones
            if (payload.getDeductions() != null && !payload.getDeductions().isEmpty()) {
                xml.append("  <Deducciones>\n");
                BigDecimal totalDeducciones = BigDecimal.ZERO;

                for (PayrollDeductionDto deduction : payload.getDeductions()) {
                    totalDeducciones = totalDeducciones.add(deduction.getAmount());
                }

                xml.append("    <Total>").append(formatAmount(totalDeducciones)).append("</Total>\n");

                for (PayrollDeductionDto deduction : payload.getDeductions()) {
                    xml.append("    <").append(deduction.getType()).append(">");
                    xml.append(formatAmount(deduction.getAmount()));
                    xml.append("</").append(deduction.getType()).append(">\n");
                }

                xml.append("  </Deducciones>\n");
            }

            // Totales
            if (payload.getTotals() != null) {
                PayrollTotalsDto totals = payload.getTotals();
                xml.append("  <DevengadosTotal>").append(formatAmount(totals.getTotalEarnings()))
                        .append("</DevengadosTotal>\n");
                xml.append("  <DeduccionesTotal>").append(formatAmount(totals.getTotalDeductions()))
                        .append("</DeduccionesTotal>\n");
                xml.append("  <ComprobanteTotal>").append(formatAmount(totals.getNetPayment()))
                        .append("</ComprobanteTotal>\n");
            }

            xml.append("</NominaIndividual>");

            String result = xml.toString();
            log.info("✅ Payroll XML generated - Size: {} bytes", result.length());

            return result;

        } catch (Exception e) {
            log.error("❌ Error generating payroll XML", e);
            throw new RuntimeException("Failed to generate payroll XML", e);
        }
    }

    /**
     * Genera el CUNE (código único de nómina electrónica)
     */
    private String generateCune(ElectronicPayrollPayload payload) {
        try {
            StringBuilder cuneString = new StringBuilder();
            cuneString.append(payload.getPayrollReceiptId());
            cuneString.append(payload.getIssueDate().format(DATE_FORMATTER));
            cuneString.append(formatAmount(payload.getTotals().getNetPayment()));
            cuneString.append(payload.getEmployer().getIdentificationNumber());
            cuneString.append(payload.getEmployee().getIdentificationNumber());

            MessageDigest digest = MessageDigest.getInstance("SHA-384");
            byte[] hash = digest.digest(cuneString.toString().getBytes());

            return bytesToHex(hash);

        } catch (Exception e) {
            log.warn("Error generating CUNE, using random UUID", e);
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
