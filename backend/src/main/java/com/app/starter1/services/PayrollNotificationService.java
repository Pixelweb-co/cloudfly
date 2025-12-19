package com.app.starter1.services;

import com.app.starter1.persistence.entity.PayrollReceipt;
import com.app.starter1.persistence.entity.PayrollPeriod;
import com.app.starter1.persistence.entity.PayrollConfiguration;
import com.app.starter1.persistence.repository.PayrollReceiptRepository;
import com.app.starter1.persistence.repository.PayrollPeriodRepository;
import com.app.starter1.persistence.repository.PayrollConfigurationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para enviar notificaciones de nómina (colillas de pago)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollNotificationService {

    private final PayrollReceiptPdfService pdfService;
    private final PayrollReceiptRepository receiptRepository;
    private final PayrollPeriodRepository periodRepository;
    private final PayrollConfigurationRepository configRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final String NOTIFICATION_TOPIC = "notification-topic";

    /**
     * Envía la colilla de pago de un recibo específico por email
     */
    public void sendReceiptByEmail(Long receiptId) {
        PayrollReceipt receipt = receiptRepository.findById(receiptId)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));

        sendReceiptByEmail(receipt);
    }

    /**
     * Envía la colilla de pago por email
     */
    public void sendReceiptByEmail(PayrollReceipt receipt) {
        String employeeEmail = receipt.getEmployee().getEmail();

        if (employeeEmail == null || employeeEmail.isBlank()) {
            log.warn("Empleado {} no tiene email configurado, no se puede enviar colilla",
                    receipt.getEmployee().getFullName());
            throw new RuntimeException("El empleado no tiene email configurado");
        }

        // Verificar si está habilitado envío por email
        PayrollConfiguration config = configRepository.findByCustomer(receipt.getEmployee().getCustomer())
                .orElse(null);

        if (config != null && !config.getSendReceiptsByEmail()) {
            log.info("Envío de colillas por email deshabilitado para este tenant");
            return;
        }

        try {
            // Generar PDF
            byte[] pdfBytes = pdfService.generateReceiptPdf(receipt);
            String pdfBase64 = Base64.getEncoder().encodeToString(pdfBytes);

            // Preparar mensaje de notificación
            Map<String, Object> message = new HashMap<>();
            message.put("to", employeeEmail);
            message.put("type", "payroll-receipt");
            message.put("subject", "Tu Colilla de Pago - " + receipt.getPayrollPeriod().getPeriodName());
            message.put("username", receipt.getEmployee().getFullName());

            // Datos para la plantilla
            Map<String, Object> templateData = new HashMap<>();
            templateData.put("employeeName", receipt.getEmployee().getFullName());
            templateData.put("employeeId",
                    receipt.getEmployee().getNationalId() != null ? receipt.getEmployee().getNationalId()
                            : receipt.getEmployee().getRfc());
            templateData.put("periodName", receipt.getPayrollPeriod().getPeriodName());
            templateData.put("periodStart", receipt.getPayrollPeriod().getStartDate().toString());
            templateData.put("periodEnd", receipt.getPayrollPeriod().getEndDate().toString());
            templateData.put("netPay", formatCurrency(receipt.getNetPay()));
            templateData.put("totalPerceptions", formatCurrency(receipt.getTotalPerceptions()));
            templateData.put("totalDeductions", formatCurrency(receipt.getTotalDeductions()));
            templateData.put("receiptNumber", receipt.getReceiptNumber());

            message.put("templateData", templateData);

            // Adjuntar PDF en Base64
            message.put("pdfAttachment", pdfBase64);
            message.put("pdfFileName", "colilla_" + receipt.getReceiptNumber() + ".pdf");

            // Enviar a Kafka
            String jsonMessage = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(NOTIFICATION_TOPIC, jsonMessage);

            log.info("Colilla de pago enviada a {} para recibo {}",
                    employeeEmail, receipt.getReceiptNumber());

        } catch (Exception e) {
            log.error("Error enviando colilla de pago a {}: {}", employeeEmail, e.getMessage());
            throw new RuntimeException("Error al enviar colilla de pago: " + e.getMessage(), e);
        }
    }

    /**
     * Envía todas las colillas de un período
     * 
     * @return número de colillas enviadas
     */
    public int sendReceiptsForPeriod(Long periodId, Long customerId) {
        PayrollPeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Período no encontrado"));

        List<PayrollReceipt> receipts = receiptRepository.findByPayrollPeriod(period);

        int sent = 0;
        int errors = 0;

        for (PayrollReceipt receipt : receipts) {
            try {
                if (receipt.getEmployee().getEmail() != null && !receipt.getEmployee().getEmail().isBlank()) {
                    sendReceiptByEmail(receipt);
                    sent++;
                } else {
                    log.warn("Empleado {} sin email, omitiendo...", receipt.getEmployee().getFullName());
                }
            } catch (Exception e) {
                errors++;
                log.error("Error enviando colilla a {}: {}",
                        receipt.getEmployee().getFullName(), e.getMessage());
            }
        }

        log.info("Colillas enviadas para período {}: {} exitosas, {} errores",
                period.getPeriodName(), sent, errors);
        return sent;
    }

    /**
     * Descarga el PDF de una colilla (sin enviar)
     */
    public byte[] downloadReceiptPdf(Long receiptId) {
        PayrollReceipt receipt = receiptRepository.findById(receiptId)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));

        return pdfService.generateReceiptPdf(receipt);
    }

    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null)
            return "$0";
        return String.format("$%,.2f", amount);
    }
}
