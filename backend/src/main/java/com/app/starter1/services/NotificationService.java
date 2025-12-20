package com.app.starter1.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;

/**
 * Servicio de notificaciones - Email y WhatsApp (Productor Kafka)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${evolution.api.url:http://localhost:8081}")
    private String evolutionApiUrl;

    @Value("${evolution.api.key:B6D711FCDE4D4FD5936544120E713976}")
    private String evolutionApiKey;

    // Tópico de notificaciones
    private static final String TOPIC_PAYROLL_NOTIFICATIONS = "payroll-notifications";

    /**
     * Envía un email (stub para integración futura)
     */
    public void sendEmail(String to, String subject, String body) {
        log.info("Email enviado a {}: {}", to, subject);
        // TODO: Integrar con servicio de email real
    }

    /**
     * Envía mensaje de WhatsApp con el desprendible de nómina (ASÍNCRONO VÍA KAFKA)
     * Lee el archivo PDF local y lo codifica en Base64 para adjuntarlo al mensaje
     */
    public boolean sendPayrollReceiptWhatsApp(
            String phoneNumber,
            String employeeName,
            String periodName,
            double netPay,
            String pdfUrl) {

        try {
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                log.warn("No se puede encolar WhatsApp: número de teléfono vacío para {}", employeeName);
                return false;
            }

            // Intentar convertir PDF a Base64
            String pdfBase64 = null;
            if (pdfUrl != null && !pdfUrl.isEmpty()) {
                try {
                    // pdfUrl se asume como ruta absoluta o relativa al sistema de archivos local
                    Path path = Paths.get(pdfUrl);
                    if (Files.exists(path)) {
                        byte[] bytes = Files.readAllBytes(path);
                        pdfBase64 = Base64.getEncoder().encodeToString(bytes);
                        log.debug("PDF convertido a Base64 correctamente para {}", employeeName);
                    } else {
                        log.warn("Archivo PDF no encontrado en ruta: {}", pdfUrl);
                    }
                } catch (Exception e) {
                    log.warn("Error leyendo/convirtiendo PDF para adjunto: {}", e.getMessage());
                }
            }

            // Crear payload
            PayrollNotificationMessage message = PayrollNotificationMessage.builder()
                    .phoneNumber(phoneNumber)
                    .employeeName(employeeName)
                    .periodName(periodName)
                    .netPay(netPay)
                    .pdfUrl(pdfUrl)
                    .pdfBase64(pdfBase64)
                    .build();

            String jsonMessage = objectMapper.writeValueAsString(message);

            // Publicar en Kafka
            kafkaTemplate.send(TOPIC_PAYROLL_NOTIFICATIONS, jsonMessage);

            log.info("Mensaje de notificación de nómina enviado a Kafka para {}", employeeName);
            return true;

        } catch (Exception e) {
            log.error("Error encolando notificación Kafka para {}: {}", employeeName, e.getMessage());
            return false;
        }
    }

    // DTO Interno para Kafka (Debe coincidir con el del consumidor)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayrollNotificationMessage {
        private String phoneNumber;
        private String employeeName;
        private String periodName;
        private double netPay;
        private String pdfUrl;
        private String pdfBase64;
    }
}
