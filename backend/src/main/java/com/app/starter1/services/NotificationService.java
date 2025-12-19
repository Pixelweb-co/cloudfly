package com.app.starter1.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Servicio de notificaciones (stub para futuras integraciones)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    // TODO: Integrar con servicio real de notificaciones/email

    public void sendEmail(String to, String subject, String body) {
        log.info("Email enviado a {}: {}", to, subject);
        // Aquí se integraría con el servicio de email real
    }

    public void sendEmailWithAttachment(String to, String subject, String body, byte[] attachment, String filename) {
        log.info("Email con adjunto enviado a {}: {} ({})", to, subject, filename);
        // Aquí se integraría con el servicio de email real
    }
}
