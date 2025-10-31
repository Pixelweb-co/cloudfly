package com.app.starter1.controllers;

import com.app.starter1.persistence.services.NotificationProducerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NotificationController {

    private final NotificationProducerService producerService;

    public NotificationController(NotificationProducerService producerService) {
        this.producerService = producerService;
    }

    @GetMapping("/sendnotification")
    public String sendNotification(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String body,
            @RequestParam String type,
            @RequestParam String username
    ) {
        String message = String.format("{\"to\":\"%s\",\"subject\":\"%s\",\"body\":\"%s\",\"type\":\"%s\",\"username\":\"%s\"}", to, subject, body,type,username);
        producerService.sendMessage("email-notifications", message);
        return "Notificación enviada a la cola.";
    }
}
