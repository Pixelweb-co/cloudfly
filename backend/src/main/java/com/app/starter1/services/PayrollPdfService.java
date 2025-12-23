package com.app.starter1.services;

import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.PayrollReceipt;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@Slf4j
public class PayrollPdfService {

    private static final Color HEADER_BG_COLOR = new Color(240, 240, 240); // Gris claro
    private static final Color TITLE_COLOR = new Color(0, 72, 132); // Azul oscuro (estilo Siigo)
    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, TITLE_COLOR);
    private static final Font FONT_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font FONT_BODY = FontFactory.getFont(FontFactory.HELVETICA, 9);
    private static final Font FONT_BODY_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FONT_SMALL = FontFactory.getFont(FontFactory.HELVETICA, 8);
    private static final Font FONT_NET_PAY = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(new Locale("es", "CO"));

    public String generateReceiptPdf(PayrollReceipt receipt, Customer customer) {
        String fileName = "nomina_" + receipt.getReceiptNumber() + ".pdf";
        // Ruta temporal o configurada. Idealmente se debería subir a S3/Storage.
        // Usaremos carpeta local temp por ahora.
        // Asumiendo que existe una carpeta "uploads" o similar configurada. Usaremos
        // ruta relativa segura.
        String filePath = "uploads/" + fileName;

        // Asegurar que el directorio existe (se podría hacer en constructor o init,
        // aquí simplificamos)
        try {
            java.nio.file.Files.createDirectories(java.nio.file.Paths.get("uploads"));
        } catch (IOException e) {
            log.error("Error creando directorio uploads", e);
        }

        try (FileOutputStream fos = new FileOutputStream(filePath)) {
            Document document = new Document(PageSize.LETTER.rotate()); // Horizontal
            PdfWriter.getInstance(document, fos);

            document.open();

            // 1. TÍTULO
            Paragraph title = new Paragraph("Comprobante de Nómina", FONT_TITLE);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // 2. CABECERA (Logo/Empresa - Info Recibo/Empleado)
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 1, 1 }); // 50% - 50%

            // -- Lado Izquierdo: Logo y Empresa --
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);

            // Logo
            if (customer.getLogoUrl() != null && !customer.getLogoUrl().isEmpty()) {
                try {
                    Image logo = Image.getInstance(customer.getLogoUrl());
                    logo.scaleToFit(100, 50);
                    leftCell.addElement(logo);
                } catch (Exception e) {
                    log.warn("No se pudo cargar el logo: {}", e.getMessage());
                    leftCell.addElement(new Paragraph(customer.getName(), FONT_HEADER)); // Fallback nombre
                }
            } else {
                leftCell.addElement(new Paragraph(customer.getName(), FONT_HEADER));
            }

            // Datos Empresa
            leftCell.addElement(new Paragraph(customer.getName(), FONT_BODY_BOLD));
            leftCell.addElement(
                    new Paragraph("NIT " + (customer.getNit() != null ? customer.getNit() : "N/A"), FONT_BODY));
            // Dirección, Teléfono opcionales

            headerTable.addCell(leftCell);

            // -- Lado Derecho: Periodo y Empleado --
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            String periodStr = receipt.getPayrollPeriod().getStartDate().format(dtf) + " - "
                    + receipt.getPayrollPeriod().getEndDate().format(dtf);

            Paragraph pPeriod = new Paragraph("Periodo de Pago: " + periodStr, FONT_BODY);
            pPeriod.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pPeriod);

            Paragraph pNum = new Paragraph("Comprobante Número: " + receipt.getReceiptNumber(), FONT_BODY);
            pNum.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pNum);

            rightCell.addElement(new Paragraph(" ")); // Espacio

            Paragraph pName = new Paragraph("Nombre: " + receipt.getEmployee().getFullName().toUpperCase(),
                    FONT_BODY_BOLD);
            pName.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pName);

            Paragraph pId = new Paragraph("Identificación: "
                    + (receipt.getEmployee().getNationalId() != null ? receipt.getEmployee().getNationalId() : "N/A"),
                    FONT_BODY);
            pId.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pId);

            Paragraph pCargo = new Paragraph("Cargo: "
                    + (receipt.getEmployee().getJobTitle() != null ? receipt.getEmployee().getJobTitle() : "N/A"),
                    FONT_BODY);
            pCargo.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pCargo);

            Paragraph pSalario = new Paragraph("Salario básico: " + formatMoney(receipt.getBaseSalary()), FONT_BODY);
            pSalario.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pSalario);

            headerTable.addCell(rightCell);
            document.add(headerTable);

            document.add(new Paragraph(" ")); // Espacio

            // 3. CUERPO (Tabla Ingesos vs Deducciones)
            // Estructura: Una tabla principal de 2 columnas. Dentro, tablas anidadas o
            // simplemente columnas.
            // Diseño imagen:
            // | INGRESOS (titulo) | DEDUCCIONES (titulo) |
            // | Concepto | Cant | Valor | Concepto | Cant | Valor | -> 6 columnas reales

            PdfPTable bodyTable = new PdfPTable(6);
            bodyTable.setWidthPercentage(100);
            // Anchos relativos: [Concepto, Cant, Valor] x2. Concepto más ancho.
            bodyTable.setWidths(new float[] { 3, 0.8f, 1.5f, 3, 0.8f, 1.5f });

            // -- Cabeceras Grandes --
            PdfPCell cellIngresosTitle = new PdfPCell(new Phrase("INGRESOS", FONT_HEADER));
            cellIngresosTitle.setColspan(3);
            cellIngresosTitle.setBackgroundColor(HEADER_BG_COLOR);
            cellIngresosTitle.setHorizontalAlignment(Element.ALIGN_CENTER);
            cellIngresosTitle.setPadding(5);
            bodyTable.addCell(cellIngresosTitle);

            PdfPCell cellDeduccionesTitle = new PdfPCell(new Phrase("DEDUCCIONES", FONT_HEADER));
            cellDeduccionesTitle.setColspan(3);
            cellDeduccionesTitle.setBackgroundColor(HEADER_BG_COLOR);
            cellDeduccionesTitle.setHorizontalAlignment(Element.ALIGN_CENTER);
            cellDeduccionesTitle.setPadding(5);
            bodyTable.addCell(cellDeduccionesTitle);

            // -- Cabeceras Columnas --
            addHeaderCell(bodyTable, "Concepto");
            addHeaderCell(bodyTable, "Cantidad");
            addHeaderCell(bodyTable, "Valor");
            addHeaderCell(bodyTable, "Concepto");
            addHeaderCell(bodyTable, "Cantidad");
            addHeaderCell(bodyTable, "Valor");

            // -- Filas Dinámicas --
            // Necesitamos dos listas para llenar en paralelo: Ingresos y Deducciones.
            // Como no tenemos Details, reconstruimos la lista basándonos en los campos del
            // Receipt.

            java.util.List<ReceiptItem> ingresos = new java.util.ArrayList<>();
            java.util.List<ReceiptItem> deducciones = new java.util.ArrayList<>();

            // Llenar Ingresos
            if (isPositive(receipt.getSalaryAmount()))
                ingresos.add(
                        new ReceiptItem("Sueldo", formatDecimal(receipt.getRegularDays()), receipt.getSalaryAmount()));
            if (isPositive(receipt.getTransportAllowanceAmount()))
                ingresos.add(new ReceiptItem("Aux. de transporte", formatDecimal(receipt.getRegularDays()),
                        receipt.getTransportAllowanceAmount()));
            if (isPositive(receipt.getOvertimeAmount()))
                ingresos.add(new ReceiptItem("Horas Extras / Recargos", formatDecimal(receipt.getOvertimeHours()),
                        receipt.getOvertimeAmount()));
            if (isPositive(receipt.getCommissionsAmount()))
                ingresos.add(new ReceiptItem("Comisiones", "-", receipt.getCommissionsAmount()));
            if (isPositive(receipt.getBonusesAmount()))
                ingresos.add(new ReceiptItem("Bonificaciones", "-", receipt.getBonusesAmount()));
            if (isPositive(receipt.getOtherEarnings()))
                ingresos.add(new ReceiptItem("Otros Devengos", "-", receipt.getOtherEarnings()));

            // Llenar Deducciones
            if (isPositive(receipt.getHealthDeduction()))
                deducciones.add(new ReceiptItem("Salud (4%)", "-", receipt.getHealthDeduction()));
            if (isPositive(receipt.getPensionDeduction()))
                deducciones.add(new ReceiptItem("Pensión (4%)", "-", receipt.getPensionDeduction()));
            if (isPositive(receipt.getOtherDeductions()))
                deducciones.add(new ReceiptItem("Otras Deducciones", "-", receipt.getOtherDeductions()));

            // Rellenar filas
            int maxRows = Math.max(ingresos.size(), deducciones.size());

            for (int i = 0; i < maxRows; i++) {
                // Ingreso (Izq)
                if (i < ingresos.size()) {
                    ReceiptItem item = ingresos.get(i);
                    addBodyCell(bodyTable, item.concept, Element.ALIGN_LEFT);
                    addBodyCell(bodyTable, item.qty, Element.ALIGN_CENTER);
                    addBodyCell(bodyTable, formatMoney(item.val), Element.ALIGN_RIGHT);
                } else {
                    addEmptyRow(bodyTable, 3);
                }

                // Deducción (Der)
                if (i < deducciones.size()) {
                    ReceiptItem item = deducciones.get(i);
                    addBodyCell(bodyTable, item.concept, Element.ALIGN_LEFT);
                    addBodyCell(bodyTable, item.qty, Element.ALIGN_CENTER);
                    addBodyCell(bodyTable, formatMoney(item.val), Element.ALIGN_RIGHT);
                } else {
                    addEmptyRow(bodyTable, 3);
                }
            }

            // -- Totales --
            // Fila de suma (negrita)
            PdfPCell cellTotalInglabel = new PdfPCell(new Phrase("Total Ingresos", FONT_BODY_BOLD));
            cellTotalInglabel.setColspan(2);
            cellTotalInglabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cellTotalInglabel.setPadding(3);
            bodyTable.addCell(cellTotalInglabel);

            PdfPCell cellTotalIngVal = new PdfPCell(
                    new Phrase(formatMoney(receipt.getTotalPerceptions()), FONT_BODY_BOLD));
            cellTotalIngVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cellTotalIngVal.setPadding(3);
            bodyTable.addCell(cellTotalIngVal);

            PdfPCell cellTotalDedLabel = new PdfPCell(new Phrase("Total Deducciones", FONT_BODY_BOLD));
            cellTotalDedLabel.setColspan(2);
            cellTotalDedLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cellTotalDedLabel.setPadding(3);
            bodyTable.addCell(cellTotalDedLabel);

            PdfPCell cellTotalDedVal = new PdfPCell(
                    new Phrase(formatMoney(receipt.getTotalDeductions()), FONT_BODY_BOLD));
            cellTotalDedVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cellTotalDedVal.setPadding(3);
            bodyTable.addCell(cellTotalDedVal);

            document.add(bodyTable);

            // 4. NETO A PAGAR
            document.add(new Paragraph(" "));

            PdfPTable netTable = new PdfPTable(2);
            netTable.setWidthPercentage(40); // Pequeña
            netTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            netTable.setWidths(new float[] { 1, 1.5f });

            PdfPCell netLabel = new PdfPCell(new Phrase("NETO A PAGAR", FONT_BODY_BOLD));
            netLabel.setBackgroundColor(new Color(220, 220, 220));
            netLabel.setPadding(5);
            netTable.addCell(netLabel);

            PdfPCell netValue = new PdfPCell(new Phrase(formatMoney(receipt.getNetPay()), FONT_NET_PAY));
            netValue.setBackgroundColor(new Color(220, 220, 220));
            netValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            netValue.setPadding(5);
            netTable.addCell(netValue);

            document.add(netTable);

            // 5. FOOTER
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph(
                    "Este comprobante de nómina fue generado automáticamente por CloudFly System.", FONT_SMALL);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

            return filePath; // Retornar ruta relativa o absoluta
        } catch (Exception e) {
            log.error("Error generando PDF", e);
            throw new RuntimeException("Error generando PDF de nómina", e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_BODY_BOLD));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(Color.WHITE); // O gris muy claro
        cell.setPadding(2);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_BODY));
        cell.setHorizontalAlignment(align);
        cell.setPadding(2);
        table.addCell(cell);
    }

    private void addEmptyRow(PdfPTable table, int cols) {
        for (int i = 0; i < cols; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(" "));
            table.addCell(cell);
        }
    }

    private boolean isPositive(BigDecimal amount) {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null)
            return "$0.00";
        return CURRENCY_FORMAT.format(amount);
    }

    private String formatDecimal(BigDecimal amount) {
        if (amount == null)
            return "0";
        return String.format("%.2f", amount); // O sin decimales si es entero
    }

    // Clase auxiliar interna
    private static class ReceiptItem {
        String concept;
        String qty;
        BigDecimal val;

        public ReceiptItem(String concept, String qty, BigDecimal val) {
            this.concept = concept;
            this.qty = qty;
            this.val = val;
        }
    }
}
