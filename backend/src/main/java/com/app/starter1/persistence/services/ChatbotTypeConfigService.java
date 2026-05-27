package com.app.starter1.persistence.services;

import com.app.starter1.dto.ChatbotTypeConfigCreateRequest;
import com.app.starter1.dto.ChatbotTypeConfigResponse;
import com.app.starter1.persistence.entity.ChatbotTypeConfig;
import com.app.starter1.persistence.repository.ChatbotTypeConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotTypeConfigService {

    private final ChatbotTypeConfigRepository repository;

    @Transactional
    public ChatbotTypeConfigResponse createChatbotTypeConfig(ChatbotTypeConfigCreateRequest request) {
        ChatbotTypeConfig config = ChatbotTypeConfig.builder()
                .typeName(request.typeName())
                .description(request.description())
                .webhookUrl(request.webhookUrl())
                .status(request.status() != null ? request.status() : true)
                .build();

        ChatbotTypeConfig savedConfig = repository.save(config);
        return mapToResponse(savedConfig);
    }

    @Transactional(readOnly = true)
    public ChatbotTypeConfigResponse getChatbotTypeConfigById(Long id) {
        ChatbotTypeConfig config = repository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException("Configuración de tipo de chatbot no encontrada con ID: " + id));
        return mapToResponse(config);
    }

    @Transactional(readOnly = true)
    public ChatbotTypeConfigResponse getChatbotTypeConfigByName(String typeName) {
        ChatbotTypeConfig config = repository.findByTypeName(typeName)
                .orElseThrow(() -> new RuntimeException(
                        "Configuración de tipo de chatbot no encontrada con nombre: " + typeName));
        return mapToResponse(config);
    }

    @Transactional(readOnly = true)
    public List<ChatbotTypeConfigResponse> getAllChatbotTypeConfigs() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatbotTypeConfigResponse> getActiveChatbotTypeConfigs() {
        return repository.findByStatus(true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatbotTypeConfigResponse updateChatbotTypeConfig(Long id, ChatbotTypeConfigCreateRequest request) {
        ChatbotTypeConfig config = repository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException("Configuración de tipo de chatbot no encontrada con ID: " + id));

        config.setTypeName(request.typeName());
        config.setDescription(request.description());
        config.setWebhookUrl(request.webhookUrl());
        config.setStatus(request.status() != null ? request.status() : config.getStatus());

        ChatbotTypeConfig updatedConfig = repository.save(config);
        return mapToResponse(updatedConfig);
    }

    @Transactional
    public void deleteChatbotTypeConfig(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Configuración de tipo de chatbot no encontrada con ID: " + id);
        }
        repository.deleteById(id);
    }

    @Transactional
    public ChatbotTypeConfigResponse toggleChatbotTypeConfigStatus(Long id) {
        ChatbotTypeConfig config = repository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException("Configuración de tipo de chatbot no encontrada con ID: " + id));

        config.setStatus(!config.getStatus());
        ChatbotTypeConfig updatedConfig = repository.save(config);
        return mapToResponse(updatedConfig);
    }

    private ChatbotTypeConfigResponse mapToResponse(ChatbotTypeConfig config) {
        return new ChatbotTypeConfigResponse(
                config.getId(),
                config.getTypeName(),
                config.getDescription(),
                config.getWebhookUrl(),
                config.getStatus(),
                config.getCreatedAt(),
                config.getUpdatedAt());
    }
}
