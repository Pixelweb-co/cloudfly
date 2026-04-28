package com.notification.service.services;

import com.notification.service.dto.NotificationMessage;
import freemarker.template.Configuration;
import freemarker.template.Template;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private Configuration freemarkerConfig;

    /**
     * Envía un email con soporte para adjuntos PDF
     */
    public void sendEmail(NotificationMessage notification) {
        String recipientsStr = notification.getTo();
        if (recipientsStr != null && recipientsStr.contains(",")) {
            String[] recipients = recipientsStr.split(",");
            for (String recipient : recipients) {
                String trimmedRecipient = recipient.trim();
                if (!trimmedRecipient.isEmpty()) {
                    sendSingleEmail(notification, trimmedRecipient);
                }
            }
        } else {
            sendSingleEmail(notification, recipientsStr != null ? recipientsStr.trim() : null);
        }
    }

    private void sendSingleEmail(NotificationMessage notification, String to) {
        if (to == null || to.isEmpty()) {
            System.err.println("Skipping email send: recipient is null or empty");
            return;
        }

        try {
            // Determinar el tipo de correo y cargar la plantilla correspondiente
            String body = loadTemplate(notification);

            // Crear un mensaje MimeMessage para enviar correo con HTML
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            // true indica que el contenido es multipart (soporta adjuntos)
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("gestorweb@cloudfly.com.co");
            helper.setTo(to);
            helper.setSubject(notification.getSubject());
            helper.setText(body, true); // El segundo parámetro true indica que el cuerpo es HTML

            // Agregar adjunto PDF si existe
            if (notification.hasPdfAttachment()) {
                byte[] pdfBytes = Base64.getDecoder().decode(notification.getPdfAttachment());
                helper.addAttachment(
                        notification.getPdfFileName(),
                        new ByteArrayResource(pdfBytes),
                        "application/pdf");
                System.out.println("PDF adjunto agregado: " + notification.getPdfFileName());
            }

            mailSender.send(mimeMessage);
            System.out.println("Email sent successfully to: " + to);

        } catch (Exception e) {
            System.err.println("Error while processing or sending email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String loadTemplate(NotificationMessage notification) throws Exception {
        // Definir el modelo de datos para cada tipo
        Map<String, Object> model = new HashMap<>();
        model.put("name", notification.getUsername());

        // Si hay datos de plantilla adicionales, agregarlos al modelo
        if (notification.getTemplateData() != null) {
            model.putAll(notification.getTemplateData());
        }

        if (notification.getType().equals("register")) {
            model.put("activateLink", notification.getBody());
        }

        if (notification.getType().equals("recover-password")) {
            model.put("username", notification.getUsername());
            model.put("recoverLink", notification.getBody());
        }

        // Para colillas de pago
        if (notification.getType().equals("payroll-receipt")) {
            model.put("employeeName", notification.getUsername());
            // Los demás datos vienen de templateData
        }

        // Para notificaciones genéricas
        if (notification.getType().equals("notification")) {
            model.put("body", notification.getBody());
            model.put("subject", notification.getSubject());
        }

        // Cargar la plantilla dependiendo del tipo
        Template template;
        try {
            template = freemarkerConfig.getTemplate(notification.getType() + ".ftl");
        } catch (Exception e) {
            System.err.println("Template not found for " + notification.getType() + ", falling back to notification.ftl");
            template = freemarkerConfig.getTemplate("notification.ftl");
            // Asegurarse de que el modelo tenga los datos necesarios para la plantilla genérica
            if (!model.containsKey("body")) model.put("body", notification.getBody());
            if (!model.containsKey("subject")) model.put("subject", notification.getSubject());
        }

        // Procesar la plantilla y devolver el cuerpo HTML
        return FreeMarkerTemplateUtils.processTemplateIntoString(template, model);
    }
}
