package com.app.starter1.services;

import com.app.starter1.persistence.entity.Employee;
import com.app.starter1.persistence.entity.PayrollReceipt;
import com.app.starter1.persistence.entity.PayrollPeriod;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Servicio para generar PDFs de colillas de pago (Adaptado a Nómina Colombia)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollReceiptPdfService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Color PRIMARY_COLOR = new Color(0, 128, 128); // Teal
    private static final Color HEADER_BG = new Color(240, 248, 255);
    private static final Color LIGHT_GRAY = new Color(245, 245, 245);

    /**
     * Genera el PDF de una colilla de pago
     */
    public byte[] generateReceiptPdf(PayrollReceipt receipt) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.LETTER);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Agregar contenido
            addHeader(document, receipt);
            addEmployeeInfo(document, receipt);
            addPeriodInfo(document, receipt);
            addPaymentSummary(document, receipt);
            addPerceptionsTable(document, receipt);
            addDeductionsTable(document, receipt);
            addFooter(document, receipt);

            document.close();
            log.info("PDF generado exitosamente para recibo {}", receipt.getReceiptNumber());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Error generando PDF para recibo {}: {}", receipt.getReceiptNumber(), e.getMessage());
            throw new RuntimeException("Error al generar PDF de colilla", e);
        }
    }

    private void addHeader(Document document, PayrollReceipt receipt) throws DocumentException {
        // Título principal
        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, PRIMARY_COLOR);
        Paragraph title = new Paragraph("COLILLA DE PAGO", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(10);
        document.add(title);

        // Información de la empresa
        String companyName = receipt.getEmployee().getCustomer().getName();
        Font companyFont = new Font(Font.HELVETICA, 12, Font.BOLD);
        Paragraph company = new Paragraph(companyName != null ? companyName : "Empresa", companyFont);
        company.setAlignment(Element.ALIGN_CENTER);
        document.add(company);

        // Línea separadora
        LineSeparator line = new LineSeparator();
        line.setLineColor(PRIMARY_COLOR);
        document.add(new Chunk(line));
        document.add(Chunk.NEWLINE);
    }

    private void addEmployeeInfo(Document document, PayrollReceipt receipt) throws DocumentException {
        Employee employee = receipt.getEmployee();

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1.5f, 2.5f, 1.5f, 2.5f });

        Font labelFont = new Font(Font.HELVETICA, 9, Font.BOLD);
        Font valueFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

        addLabelValueCell(table, "Empleado:", employee.getFullName(), labelFont, valueFont);
        addLabelValueCell(table, "Identificación:",
                employee.getNationalId() != null ? employee.getNationalId()
                        : (employee.getRfc() != null ? employee.getRfc() : "N/A"),
                labelFont, valueFont);
        addLabelValueCell(table, "Cargo:", employee.getJobTitle(), labelFont, valueFont);
        addLabelValueCell(table, "Departamento:", employee.getDepartment(), labelFont, valueFont);

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addPeriodInfo(Document document, PayrollReceipt receipt) throws DocumentException {
        PayrollPeriod period = receipt.getPayrollPeriod();

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1.5f, 2.5f, 1.5f, 2.5f });

        Font labelFont = new Font(Font.HELVETICA, 9, Font.BOLD);
        Font valueFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

        addLabelValueCell(table, "Período:", period != null ? period.getPeriodName() : "N/A", labelFont, valueFont);
        addLabelValueCell(table, "Fecha Inicio:", period != null ? period.getStartDate().format(DATE_FORMAT) : "-",
                labelFont, valueFont);
        addLabelValueCell(table, "Fecha Fin:", period != null ? period.getEndDate().format(DATE_FORMAT) : "-",
                labelFont, valueFont);
        addLabelValueCell(table, "Días Liquidados:",
                receipt.getRegularDays() != null ? receipt.getRegularDays().toString() : "0",
                labelFont, valueFont);
        addLabelValueCell(table, "Método Pago:",
                receipt.getEmployee().getPaymentMethod() != null ? receipt.getEmployee().getPaymentMethod().name()
                        : "BANK_TRANSFER",
                labelFont, valueFont);
        addLabelValueCell(table, "Recibo #:", receipt.getReceiptNumber(), labelFont, valueFont);

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addPaymentSummary(Document document, PayrollReceipt receipt) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);

        Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
        Font valueFont = new Font(Font.HELVETICA, 11, Font.BOLD);

        // Headers
        String[] headers = { "Salario Base", "Total Devengado", "Total Deducciones", "NETO A PAGAR" };
        Color[] colors = { new Color(100, 149, 237), new Color(60, 179, 113),
                new Color(220, 53, 69), PRIMARY_COLOR };

        for (int i = 0; i < headers.length; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(headers[i], headerFont));
            cell.setBackgroundColor(colors[i]);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(8);
            table.addCell(cell);
        }

        // Values
        String[] values = {
                formatCurrency(receipt.getBaseSalary()),
                formatCurrency(receipt.getTotalPerceptions()), // Usando el campo de la Entidad
                formatCurrency(receipt.getTotalDeductions()),
                formatCurrency(receipt.getNetPay())
        };

        for (int i = 0; i < values.length; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(values[i], valueFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(10);
            cell.setBackgroundColor(LIGHT_GRAY);
            table.addCell(cell);
        }

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addPerceptionsTable(Document document, PayrollReceipt receipt) throws DocumentException {
        Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(60, 179, 113));
        Paragraph section = new Paragraph("DEVENGOS", sectionFont);
        section.setSpacingAfter(5);
        document.add(section);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 3f, 1f, 1.5f });

        // Headers
        addTableHeader(table, new String[] { "Concepto", "Detalle", "Valor" });

        // Usando campos planos de la Entidad
        if (hasValue(receipt.getSalaryAmount())) {
            addTableRow(table, "Sueldo Básico", "-", formatCurrency(receipt.getSalaryAmount()));
        }
        if (hasValue(receipt.getTransportAllowanceAmount())) {
            addTableRow(table, "Auxilio de Transporte", "-", formatCurrency(receipt.getTransportAllowanceAmount()));
        }
        if (hasValue(receipt.getOvertimeAmount())) {
            addTableRow(table, "Horas Extras y Recargos", "-", formatCurrency(receipt.getOvertimeAmount()));
        }
        if (hasValue(receipt.getBonusesAmount())) {
            addTableRow(table, "Bonificaciones", "-", formatCurrency(receipt.getBonusesAmount()));
        }
        if (hasValue(receipt.getCommissionsAmount())) {
            addTableRow(table, "Comisiones", "-", formatCurrency(receipt.getCommissionsAmount()));
        }
        if (hasValue(receipt.getOtherEarnings())) {
            addTableRow(table, "Otros Ingresos", "-", formatCurrency(receipt.getOtherEarnings()));
        }

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addDeductionsTable(Document document, PayrollReceipt receipt) throws DocumentException {
        Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(220, 53, 69));
        Paragraph section = new Paragraph("DEDUCCIONES", sectionFont);
        section.setSpacingAfter(5);
        document.add(section);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 3f, 1f, 1.5f });

        addTableHeader(table, new String[] { "Concepto", "Detalle", "Valor" });

        // Usando campos planos de la Entidad
        if (hasValue(receipt.getHealthDeduction())) {
            addTableRow(table, "Aporte Salud (4%)", "-", formatCurrency(receipt.getHealthDeduction()));
        }
        if (hasValue(receipt.getPensionDeduction())) {
            addTableRow(table, "Aporte Pensión (4%)", "-", formatCurrency(receipt.getPensionDeduction()));
        }
        if (hasValue(receipt.getOtherDeductions())) {
            addTableRow(table, "Otras Deducciones/Libranzas", "-", formatCurrency(receipt.getOtherDeductions()));
        }

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addFooter(Document document, PayrollReceipt receipt) throws DocumentException {
        LineSeparator line = new LineSeparator();
        line.setLineColor(Color.LIGHT_GRAY);
        document.add(new Chunk(line));

        Font footerFont = new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY);
        Paragraph footer = new Paragraph(
                "Este documento es una representación de su colilla de pago. " +
                        "Generado automáticamente el " + java.time.LocalDate.now().format(DATE_FORMAT) +
                        " - CloudFly",
                footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(10);
        document.add(footer);
    }

    private void addLabelValueCell(PdfPTable table, String label, String value,
            Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setBackgroundColor(LIGHT_GRAY);
        labelCell.setPadding(5);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }

    private void addTableHeader(PdfPTable table, String[] headers) {
        Font headerFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(new Color(70, 70, 70));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(6);
            table.addCell(cell);
        }
    }

    private void addTableRow(PdfPTable table, String concept, String quantity, String value) {
        Font font = new Font(Font.HELVETICA, 9, Font.NORMAL);

        PdfPCell conceptCell = new PdfPCell(new Phrase(concept, font));
        conceptCell.setPadding(5);
        table.addCell(conceptCell);

        PdfPCell quantityCell = new PdfPCell(new Phrase(quantity, font));
        quantityCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        quantityCell.setPadding(5);
        table.addCell(quantityCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null)
            return "$0";
        return String.format("$%,.2f", amount);
    }

    private boolean hasValue(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }
}
