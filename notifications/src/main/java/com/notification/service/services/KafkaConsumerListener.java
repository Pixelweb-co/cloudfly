package com.notification.service.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.notification.service.dto.NotificationMessage;
import com.notification.service.dto.PayrollNotificationMessage;
import com.notification.service.dto.WelcomeNotificationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import org.springframework.jdbc.core.JdbcTemplate;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Configuration
public class KafkaConsumerListener {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Logger LOGGER = LoggerFactory.getLogger(KafkaConsumerListener.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private EmailService emailService;

    @Value("${EVOLUTION_API_URL:http://evolution-api:8080}")
    private String evolutionApiUrl;

    @Value("${EVOLUTION_API_KEY:B6D711FCDE4D4FD5936544120E713976}")
    private String evolutionApiKey;

    @Value("${evolution.api.instance:gm2}")
    private String instanceName;

    @KafkaListener(topics = { "email-notifications", "whatsapp-notifications" }, groupId = "email-service")
    public void listener(String message) {
        LOGGER.info("Received email message: " + message);

        try {
            NotificationMessage notification = objectMapper.readValue(message, NotificationMessage.class);
            
            if ("whatsapp".equalsIgnoreCase(notification.getNotifyVia()) || "whatsapp".equalsIgnoreCase(notification.getType())) {
                sendWhatsAppNotification(notification);
            } else {
                emailService.sendEmail(notification);
            }
        } catch (Exception e) {
            LOGGER.error("Error while processing or sending notification: ", e);
        }
    }

    private void sendWhatsAppNotification(NotificationMessage notification) {
        String phonesStr = notification.getPhones();
        String targetStr = (phonesStr != null && !phonesStr.isEmpty()) ? phonesStr : notification.getTo();
        
        if (targetStr != null && targetStr.contains(",")) {
            String[] recipients = targetStr.split(",");
            for (String recipient : recipients) {
                String trimmedRecipient = recipient.trim();
                if (!trimmedRecipient.isEmpty()) {
                    sendSingleWhatsAppNotification(notification, trimmedRecipient);
                }
            }
        } else {
            sendSingleWhatsAppNotification(notification, targetStr != null ? targetStr.trim() : null);
        }
    }

    private void sendSingleWhatsAppNotification(NotificationMessage notification, String to) {
        if (to == null || to.isEmpty()) {
            LOGGER.warn("Skipping WhatsApp send: recipient is null or empty");
            return;
        }

        String instance = findInstanceFor(notification.getTenantId(), notification.getCompanyId());
        LOGGER.info("Sending WhatsApp notification to {} using instance: {}", to, instance);
        
        String formattedPhone = formatPhoneNumber(to);
        boolean sent = sendWhatsAppTextWithInstance(formattedPhone, notification.getBody(), instance, evolutionApiKey);
        
        if (sent) {
            LOGGER.info("WhatsApp notification sent successfully to " + formattedPhone);
        } else {
            LOGGER.error("Failed to send WhatsApp notification to " + formattedPhone);
        }
    }

    private String findInstanceFor(Long tenantId, Long companyId) {
        if (tenantId == null || companyId == null) return instanceName;
        
        try {
            String sql = "SELECT instance_name FROM channels WHERE tenant_id = ? AND company_id = ? AND platform = 'WHATSAPP' AND instance_name IS NOT NULL LIMIT 1";
            List<String> results = jdbcTemplate.queryForList(sql, String.class, tenantId, companyId);
            
            if (!results.isEmpty() && results.get(0) != null) {
                return results.get(0);
            }
        } catch (Exception e) {
            LOGGER.error("Error looking up instance for tenant {} company {}: {}", tenantId, companyId, e.getMessage());
        }
        
        return instanceName;
    }

    @KafkaListener(topics = "register-user", groupId = "notification-service-register")
    public void consumeRegisterUser(String messageJson) {
        try {
            LOGGER.info("Received register-user message: " + messageJson);
            Map<String, String> data = objectMapper.readValue(messageJson, Map.class);

            NotificationMessage notification = new NotificationMessage();
            notification.setTo(data.get("email"));
            notification.setSubject("Bienvenido a Cloudfly - Activa tu cuenta");
            notification.setUsername(data.get("name"));
            notification.setType("register");

            // Construimos el link de activación correcto para producción
            String activateLink = "https://dashboard.cloudfly.com.co/verificate/" + data.get("token");
            notification.setBody(activateLink);

            emailService.sendEmail(notification);
            LOGGER.info("Registration email sent to: " + data.get("email"));
        } catch (Exception e) {
            LOGGER.error("Error consuming register-user notification: ", e);
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

    @KafkaListener(topics = "welcome-notifications", groupId = "notification-service-welcome")
    public void consumeWelcomeNotification(String messageJson) {
        LOGGER.info("Received message from welcome-notifications topic: " + messageJson);
        try {
            WelcomeNotificationMessage message = objectMapper.readValue(messageJson, WelcomeNotificationMessage.class);
            LOGGER.info("Processing welcome notification for: " + message.getCustomerName() + " to phone: " + message.getPhoneNumber());

            String formattedPhone = formatPhoneNumber(message.getPhoneNumber());
            LOGGER.info("Formatted phone number: " + formattedPhone);

            String welcomeCaption = String.format(
                "🚀 *¡Bienvenido a CloudFly!* 🚀\n\n" +
                "Hola %s,\n\n" +
                "Es un gusto saludarte. Hemos completado el flujo de configuración de tu cuenta exitosamente.\n\n" +
                "📝 *Detalles del Registro:*\n" +
                "🏢 *Empresa:* %s\n" +
                "👤 *Contacto:* %s\n" +
                "📧 *Email:* %s\n" +
                "💼 *Tipo de Negocio:* %s\n\n" +
                "¡Estamos emocionados de acompañarte en el crecimiento de tu negocio!\n\n" +
                "Si necesitas ayuda, nuestro equipo de soporte está listo para asistirte.\n\n" +
                "_Mensaje enviado automáticamente_",
                message.getContactName(),
                message.getCustomerName(),
                message.getContactName(),
                message.getEmail(),
                message.getBusinessType());

            // Usamos la instancia del mensaje o el fallback por defecto
            String targetInstance = (message.getInstanceName() != null && !message.getInstanceName().isEmpty()) 
                                    ? message.getInstanceName() : instanceName;
            
            // La instancia debe haber sido creada manualmente por el usuario
            // No intentamos asegurar/crear aquí para cumplir con el flujo manual

            boolean sent = sendWhatsAppTextWithInstance(formattedPhone, welcomeCaption, targetInstance, evolutionApiKey);

            if (sent)
                LOGGER.info("Welcome WhatsApp successfully sent to " + formattedPhone + " via " + targetInstance);
            else {
                LOGGER.warn("Failed to send Welcome WhatsApp to " + formattedPhone + " via " + targetInstance + ". Trying fallback instance: " + instanceName);
                if (!targetInstance.equals(instanceName)) {
                     sendWhatsAppTextWithInstance(formattedPhone, welcomeCaption, instanceName, evolutionApiKey);
                }
            }

        } catch (Exception e) {
            LOGGER.error("Error consuming welcome notification message: ", e);
        }
    }

    private void ensureInstanceActive(String instance) {
        try {
            String statusUrl = evolutionApiUrl + "/instance/connectionState/" + instance;
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", evolutionApiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            try {
                ResponseEntity<Map> response = restTemplate.exchange(statusUrl, HttpMethod.GET, entity, Map.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    LOGGER.info("Instance " + instance + " status: " + response.getBody());
                    return;
                }
            } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
                LOGGER.warn("Instance " + instance + " not found. Attempting to create it.");
                createEvolutionInstance(instance);
            }
        } catch (Exception e) {
            LOGGER.error("Error ensuring instance " + instance + " is active: " + e.getMessage());
        }
    }

    private void createEvolutionInstance(String instance) {
        try {
            String createUrl = evolutionApiUrl + "/instance/create";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", evolutionApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("instanceName", instance);
            body.put("token", evolutionApiKey);
            body.put("qrcode", true);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(createUrl, request, String.class);
            LOGGER.info("Instance " + instance + " created successfully.");
        } catch (Exception e) {
            LOGGER.error("Failed to create instance " + instance + ": " + e.getMessage());
        }
    }

    private boolean sendWhatsAppTextWithInstance(String phoneNumber, String message, String specificInstance, String apiKey) {
        try {
            String url = evolutionApiUrl + "/message/sendText/" + specificInstance;
            LOGGER.info("Post to Evolution API URL: " + url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", apiKey);

            // Evolution API v2 format: { number, text }
            // Based on https://doc.evolution-api.com/v2/api-reference/message-controller/send-text
            Map<String, Object> body = new HashMap<>();
            body.put("number", phoneNumber);
            body.put("text", message);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            LOGGER.info("Evolution API Response Status: " + response.getStatusCode());
            LOGGER.info("Evolution API Response Body: " + response.getBody());

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            String errorMessage = e.getMessage();
            if (e instanceof org.springframework.web.client.HttpStatusCodeException) {
                org.springframework.web.client.HttpStatusCodeException httpEx = 
                    (org.springframework.web.client.HttpStatusCodeException) e;
                errorMessage = "Status: " + httpEx.getStatusCode() + 
                               " Body: " + httpEx.getResponseBodyAsString();
            }
            LOGGER.error("Error sending text WhatsApp with instance " + specificInstance + ": " + errorMessage);
            return false;
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
