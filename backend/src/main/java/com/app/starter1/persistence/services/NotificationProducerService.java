package com.app.starter1.persistence.services;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public NotificationProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(String topic, String message) {
        kafkaTemplate.send(topic, message);
        System.out.println("Mensaje enviado a Kafka: " + message);


    }
}
