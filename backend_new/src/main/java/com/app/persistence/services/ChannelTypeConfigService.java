package com.app.persistence.services;

import com.app.dto.ChannelTypeConfigDTO;
import com.app.persistence.entity.ChannelTypeConfig;
import com.app.persistence.repository.ChannelTypeConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelTypeConfigService {

    private final ChannelTypeConfigRepository repository;

    public Mono<ChannelTypeConfigDTO> createChannelTypeConfig(ChannelTypeConfigDTO dto) {
        log.info("🚀 [CHANNEL-TYPE-CONFIG-SERVICE] Creating config for type: {}", dto.typeName());
        ChannelTypeConfig config = ChannelTypeConfig.builder()
                .typeName(dto.typeName())
                .description(dto.description())
                .webhookUrl(dto.webhookUrl())
                .status(dto.status() != null ? dto.status() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return repository.save(config)
                .map(this::mapToDTO);
    }

    public Mono<ChannelTypeConfigDTO> getById(Long id) {
        return repository.findById(id)
                .map(this::mapToDTO);
    }

    public Mono<ChannelTypeConfigDTO> getByName(String typeName) {
        return repository.findByTypeName(typeName)
                .map(this::mapToDTO);
    }

    public Flux<ChannelTypeConfigDTO> getAll() {
        return repository.findAll()
                .map(this::mapToDTO);
    }

    public Flux<ChannelTypeConfigDTO> getActive() {
        return repository.findByStatus(true)
                .map(this::mapToDTO);
    }

    public Mono<ChannelTypeConfigDTO> update(Long id, ChannelTypeConfigDTO dto) {
        return repository.findById(id)
                .flatMap(config -> {
                    config.setTypeName(dto.typeName());
                    config.setDescription(dto.description());
                    config.setWebhookUrl(dto.webhookUrl());
                    config.setStatus(dto.status() != null ? dto.status() : config.getStatus());
                    config.setUpdatedAt(LocalDateTime.now());
                    return repository.save(config);
                })
                .map(this::mapToDTO);
    }

    public Mono<Void> delete(Long id) {
        return repository.deleteById(id);
    }

    public Mono<ChannelTypeConfigDTO> toggleStatus(Long id) {
        return repository.findById(id)
                .flatMap(config -> {
                    config.setStatus(!config.getStatus());
                    config.setUpdatedAt(LocalDateTime.now());
                    return repository.save(config);
                })
                .map(this::mapToDTO);
    }

    private ChannelTypeConfigDTO mapToDTO(ChannelTypeConfig entity) {
        return new ChannelTypeConfigDTO(
                entity.getId(),
                entity.getTypeName(),
                entity.getDescription(),
                entity.getWebhookUrl(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
