package com.notification.service.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.notification.service.dto.NotificationMessage;
import com.notification.service.dto.PayrollNotificationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerListener {

    private Logger LOGGER = LoggerFactory.getLogger(KafkaConsumerListener.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private EmailService emailService;

    @Value("${evolution.api.url:http://evolution_api:8080}")
    private String evolutionApiUrl;

    @Value("${evolution.api.key:B6D711FCDE4D4FD5936544120E713976}")
    private String evolutionApiKey;

    @Value("${evolution.api.instance:gm2}")
    private String instanceName;

    @KafkaListener(topics = { "email-notifications" }, groupId = "email-service")
    public void listener(String message) {
        LOGGER.info("Received email message: " + message);

        try {
            NotificationMessage notification = objectMapper.readValue(message, NotificationMessage.class);
            emailService.sendEmail(notification);
        } catch (Exception e) {
            LOGGER.error("Error while processing or sending email: ", e);
        }
    }

    @KafkaListener(topics = "payroll-notifications", groupId = "notification-service-payroll")
    public void consumePayrollNotification(String messageJson) {
        try {
            PayrollNotificationMessage message = objectMapper.readValue(messageJson, PayrollNotificationMessage.class);
            LOGGER.info("Processing payroll notification for: " + message.getEmployeeName());

            processAndSendWhatsApp(message);

        } catch (Exception e) {
            LOGGER.error("Error consuming payroll notification: ", e);
        }
    }

    private void processAndSendWhatsApp(PayrollNotificationMessage message) {
        String formattedPhone = formatPhoneNumber(message.getPhoneNumber());

        String caption = String.format(
                "✅ *¡Pago de Nómina Realizado!*\n\n" +
                        "Hola %s,\n\n" +
                        "Te informamos que se ha realizado el pago de tu nómina correspondiente al período:\n\n" +
                        "📅 *Período:* %s\n" +
                        "💰 *Monto pagado:* $%,.2f COP\n\n" +
                        "Tu desprendible de nómina está adjunto en este mensaje.\n\n" +
                        "Si tienes alguna pregunta, no dudes en contactarnos.\n\n" +
                        "_Mensaje automático - No responder_",
                message.getEmployeeName(),
                message.getPeriodName(),
                message.getNetPay());

        boolean SENT = false;
        if (message.getPdfUrl() != null && !message.getPdfUrl().isEmpty()) {
            SENT = sendWhatsAppWithMedia(formattedPhone, caption, message.getPdfUrl(), "Desprendible.pdf");
        } else {
            SENT = sendWhatsAppText(formattedPhone, caption);
        }

        if (SENT)
            LOGGER.info("WhatsApp sent to " + formattedPhone);
        else
            LOGGER.error("Failed to send WhatsApp to " + formattedPhone);
    }

    private boolean sendWhatsAppText(String phoneNumber, String message) {
        try {
            String url = evolutionApiUrl + "/message/sendText/" + instanceName;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", evolutionApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("number", phoneNumber);
            body.put("text", message);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            LOGGER.error("Error sending text WhatsApp: " + e.getMessage());
            return false;
        }
    }

    private boolean sendWhatsAppWithMedia(String phoneNumber, String caption, String mediaUrl, String fileName) {
        try {
            String url = evolutionApiUrl + "/message/sendMedia/" + instanceName;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", evolutionApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("number", phoneNumber);
            body.put("mediatype", "document");
            body.put("media", mediaUrl);
            body.put("caption", caption);
            body.put("fileName", fileName);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            LOGGER.error("Error sending media WhatsApp: " + e.getMessage());
            return false;
        }
    }

    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null)
            return "";
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");
        if (cleaned.startsWith("57") && cleaned.length() == 12)
            return cleaned;
        if (cleaned.startsWith("0"))
            cleaned = cleaned.substring(1);
        if (cleaned.length() == 10)
            return "57" + cleaned;
        return cleaned;
    }
}
