package com.notification.service.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.notification.service.dto.NotificationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.KafkaListener;

@Configuration
public class KafkaConsumerListener {

    private Logger LOGGER = LoggerFactory.getLogger(KafkaConsumerListener.class);

    @Autowired
    private EmailService emailService; // Inyectar el servicio de correo

    @KafkaListener(topics = {"email-notifications"}, groupId = "email-service")
    public void listener(String message) {
        LOGGER.info("Received message: " + message);

        try {
            // Parsear el mensaje JSON a un objeto NotificationMessage
            ObjectMapper objectMapper = new ObjectMapper();
            NotificationMessage notification = objectMapper.readValue(message, NotificationMessage.class);

            // Llamar al servicio para enviar el correo
            emailService.sendEmail(notification);

        } catch (Exception e) {
            LOGGER.error("Error while processing or sending email: ", e);
        }
    }
}
