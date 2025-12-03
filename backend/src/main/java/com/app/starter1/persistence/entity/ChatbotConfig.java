package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long tenantId;

    @Column(nullable = false)
    private String instanceName; // Matches Evolution API instance

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatbotType chatbotType;

    @Column(nullable = false)
    private Boolean isActive = false;

    @Column(columnDefinition = "TEXT")
    private String n8nWebhookUrl;

    @Column(columnDefinition = "TEXT")
    private String context; // System prompt / Business context

    @Column(columnDefinition = "TEXT")
    private String apiKey; // API Key for this tenant's bot

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
