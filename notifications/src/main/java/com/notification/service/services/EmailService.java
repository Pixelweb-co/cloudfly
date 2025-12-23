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
        try {
            // Determinar el tipo de correo y cargar la plantilla correspondiente
            String body = loadTemplate(notification);

            // Crear un mensaje MimeMessage para enviar correo con HTML
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            // true indica que el contenido es multipart (soporta adjuntos)
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("gestorweb@cloudfly.com.co");
            helper.setTo(notification.getTo());
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
            System.out.println("Email sent successfully to: " + notification.getTo());

        } catch (Exception e) {
            System.err.println("Error while processing or sending email: " + e.getMessage());
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

        // Cargar la plantilla dependiendo del tipo
        Template template = freemarkerConfig.getTemplate(notification.getType() + ".ftl");

        // Procesar la plantilla y devolver el cuerpo HTML
        return FreeMarkerTemplateUtils.processTemplateIntoString(template, model);
    }
}
