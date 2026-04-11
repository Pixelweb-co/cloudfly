package com.app.persistence.services;

import com.app.dto.ChannelConfigDTO;
import com.app.persistence.entity.ChannelConfig;
import com.app.persistence.entity.ChannelType;
import com.app.persistence.repository.ChannelConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelConfigService {

    private final ChannelConfigRepository channelConfigRepository;
    private final EvolutionService evolutionService;

    public Mono<ChannelConfigDTO> getConfigByTenant(Long tenantId) {
        log.info("📋 [CHANNEL-CONFIG-SERVICE] Getting config for tenantId: {}", tenantId);
        return channelConfigRepository.findByTenantId(tenantId)
                .map(this::mapToDTO);
    }

    public Mono<ChannelConfigDTO> getStatus(Long tenantId) {
        log.info("📊 [CHANNEL-CONFIG-SERVICE] Getting status for tenantId: {}", tenantId);
        return channelConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.checkConnection(config.getInstanceName())
                        .flatMap(statusRes -> {
                            ChannelConfigDTO dto = mapToDTO(config);
                            dto.setExists(true);
                            Object instObj = statusRes.get("instance");
                            if (instObj instanceof Map) {
                                Map<String, Object> instance = (Map<String, Object>) instObj;
                                String state = (String) instance.get("state");
                                if (state == null) state = (String) instance.get("status");
                                dto.setIsConnected("open".equals(state));
                            } else {
                                String connectionState = (String) statusRes.get("state");
                                if (connectionState == null) connectionState = (String) statusRes.get("status");
                                dto.setIsConnected("open".equals(connectionState));
                            }

                            if (!dto.getIsConnected()) {
                                return evolutionService.fetchQrCode(config.getInstanceName())
                                        .map(qrRes -> {
                                            if (qrRes != null && qrRes.containsKey("base64")) {
                                                dto.setQrCode((String) qrRes.get("base64"));
                                            }
                                            return dto;
                                        })
                                        .onErrorResume(e -> Mono.just(dto));
                            }
                            return Mono.just(dto);
                        })
                        .onErrorResume(e -> {
                            log.warn("⚠️ Instance not found in Evolution: {}", config.getInstanceName());
                            ChannelConfigDTO dto = mapToDTO(config);
                            dto.setExists(false);
                            dto.setIsConnected(false);
                            return Mono.just(dto);
                        })
                )
                .switchIfEmpty(Mono.just(ChannelConfigDTO.builder().exists(false).isConnected(false).build()));
    }

    public Mono<ChannelConfigDTO> activateChatbot(Long tenantId) {
        log.info("🚀 [CHANNEL-CONFIG-SERVICE] Activating channel for tenant: {}", tenantId);
        return channelConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.createInstance(config.getInstanceName())
                        .onErrorResume(err -> {
                            if (err.getMessage().contains("already exists")) {
                                log.info("ℹ️ [CHANNEL-CONFIG-SERVICE] Instance already exists, continuing with update/status");
                                return Mono.empty();
                            }
                            return Mono.error(err);
                        })
                        .then(Mono.defer(() -> {
                            log.info("✅ [CHANNEL-CONFIG-SERVICE] Ensuring config is active: {}", tenantId);
                            config.setIsActive(true);
                            config.setUpdatedAt(LocalDateTime.now());
                            return channelConfigRepository.save(config)
                                    .then(getQrOnlyIfDisconnected(tenantId));
                        }))
                );
    }

    private Mono<ChannelConfigDTO> getQrOnlyIfDisconnected(Long tenantId) {
        return getStatus(tenantId);
    }

    public Mono<ChannelConfigDTO> getQrCode(Long tenantId) {
        log.info("🔲 [CHANNEL-CONFIG-SERVICE] Getting QR code for tenantId: {}", tenantId);
        return channelConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> evolutionService.fetchQrCode(config.getInstanceName())
                        .map(qrRes -> {
                            ChannelConfigDTO dto = mapToDTO(config);
                            if (qrRes != null && qrRes.containsKey("base64")) {
                                dto.setQrCode((String) qrRes.get("base64"));
                            }
                            return dto;
                        })
                );
    }

    public Mono<ChannelConfigDTO> createOrUpdateConfig(Long tenantId, ChannelConfigDTO dto) {
        log.info("💾 [CHANNEL-CONFIG-SERVICE] Saving config for tenantId: {}", tenantId);
        return channelConfigRepository.findByTenantId(tenantId)
                .flatMap(config -> {
                    config.setUpdatedAt(LocalDateTime.now());
                    return channelConfigRepository.save(config);
                })
                .map(this::mapToDTO);
    }

    private ChannelConfigDTO mapToDTO(ChannelConfig entity) {
        return ChannelConfigDTO.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .instanceName(entity.getInstanceName())
                .channelType(entity.getChannelType())
                .isActive(entity.getIsActive())
                .n8nWebhookUrl(entity.getN8nWebhookUrl())
                .apiKey(entity.getApiKey())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
