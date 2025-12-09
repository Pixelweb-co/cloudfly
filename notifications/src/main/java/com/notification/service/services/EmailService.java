package com.notification.service.services;

import com.notification.service.dto.NotificationMessage;
import freemarker.template.Configuration;
import freemarker.template.Template;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private Configuration freemarkerConfig;

    public void sendEmail(NotificationMessage notification) {
        try {
            // Determinar el tipo de correo y cargar la plantilla correspondiente
            String body = loadTemplate(notification);

            // Crear un mensaje MimeMessage para enviar correo con HTML
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true); // true indica que el contenido es HTML

            helper.setFrom("gestorweb@cloudfly.com.co");
            helper.setTo(notification.getTo());
            helper.setSubject(notification.getSubject());
            helper.setText(body, true); // El segundo parámetro true indica que el cuerpo es HTML

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

        if (notification.getType().equals("register")) {
            model.put("activateLink", notification.getBody()); // O cualquier otro valor dinámico
        }

        if (notification.getType().equals("recover-password")) {
            model.put("username", notification.getUsername());
            model.put("recoverLink", notification.getBody()); // O cualquier otro valor dinámico
        }

        // Cargar la plantilla dependiendo del tipo
        Template template = freemarkerConfig.getTemplate(notification.getType() + ".ftl");

        // Procesar la plantilla y devolver el cuerpo HTML
        return FreeMarkerTemplateUtils.processTemplateIntoString(template, model);
    }
}
