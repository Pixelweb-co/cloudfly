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

    public Mono<ChannelConfigDTO> getConfigByTenantAndCompany(Long tenantId, Long companyId) {
        log.info("📋 [CHANNEL-CONFIG-SERVICE] Getting config for tenantId: {}, companyId: {}", tenantId, companyId);
        return channelConfigRepository.findByTenantIdAndCompanyId(tenantId, companyId)
                .map(this::mapToDTO);
    }

    public Mono<ChannelConfigDTO> getStatus(Long tenantId, Long companyId) {
        log.info("📊 [CHANNEL-CONFIG-SERVICE] Getting status for tenantId: {}, companyId: {}", tenantId, companyId);
        return channelConfigRepository.findByTenantIdAndCompanyId(tenantId, companyId)
                .flatMap(config -> {
                    String instanceName = config.getInstanceName();
                    if (instanceName == null || instanceName.isEmpty()) {
                        instanceName = String.format("cloudfly_t%d_c%d", tenantId, companyId);
                    }
                    final String finalName = instanceName;
                    return evolutionService.checkConnection(finalName)
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
                                return evolutionService.fetchQrCode(finalName)
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
                            log.warn("⚠️ Instance not found in Evolution: {}", finalName);
                            ChannelConfigDTO dto = mapToDTO(config);
                            dto.setExists(true); // The config exists in DB, but not in Evolution
                            dto.setIsConnected(false);
                            return Mono.just(dto);
                        });
                })
                .switchIfEmpty(Mono.just(ChannelConfigDTO.builder().exists(false).isConnected(false).build()));
    }

    public Mono<ChannelConfigDTO> activateChatbot(Long tenantId, Long companyId) {
        log.info("🚀 [CHANNEL-CONFIG-SERVICE] Activating channel for tenant: {}, company: {}", tenantId, companyId);
        String expectedInstanceName = String.format("cloudfly_t%d_c%d", tenantId, companyId);
        
        return channelConfigRepository.findByTenantIdAndCompanyId(tenantId, companyId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("🆕 [CHANNEL-CONFIG-SERVICE] Creating new default config for tenant: {}, company: {}", tenantId, companyId);
                    ChannelConfig newConfig = new ChannelConfig();
                    newConfig.setTenantId(tenantId);
                    newConfig.setCompanyId(companyId);
                    newConfig.setInstanceName(expectedInstanceName);
                    newConfig.setChannelType(ChannelType.SALES);
                    newConfig.setIsActive(false);
                    newConfig.setCreatedAt(LocalDateTime.now());
                    return channelConfigRepository.save(newConfig);
                }))
                .flatMap(config -> {
                    String instanceName = config.getInstanceName();
                    if (instanceName == null || instanceName.isEmpty()) {
                        instanceName = expectedInstanceName;
                        config.setInstanceName(instanceName);
                    }
                    final String finalName = instanceName;
                    return evolutionService.createInstance(finalName)
                        .onErrorResume(err -> {
                            if (err.getMessage().contains("already exists")) {
                                log.info("ℹ️ [CHANNEL-CONFIG-SERVICE] Instance already exists, continuing");
                                return Mono.empty();
                            }
                            return Mono.error(err);
                        })
                        .then(Mono.defer(() -> {
                            log.info("✅ [CHANNEL-CONFIG-SERVICE] Ensuring config is active: {}", tenantId);
                            config.setIsActive(true);
                            config.setUpdatedAt(LocalDateTime.now());
                            return channelConfigRepository.save(config)
                                    .then(getStatus(tenantId, companyId));
                        }));
                });
    }

    public Mono<ChannelConfigDTO> getQrCode(Long tenantId, Long companyId) {
        log.info("🔲 [CHANNEL-CONFIG-SERVICE] Getting QR code for tenantId: {}, companyId: {}", tenantId, companyId);
        return channelConfigRepository.findByTenantIdAndCompanyId(tenantId, companyId)
                .flatMap(config -> {
                    String instanceName = config.getInstanceName();
                    if (instanceName == null || instanceName.isEmpty()) {
                        instanceName = String.format("cloudfly_t%d_c%d", tenantId, companyId);
                    }
                    return evolutionService.fetchQrCode(instanceName)
                        .map(qrRes -> {
                            ChannelConfigDTO dto = mapToDTO(config);
                            if (qrRes != null && qrRes.containsKey("base64")) {
                                dto.setQrCode((String) qrRes.get("base64"));
                            }
                            return dto;
                        });
                });
    }

    public Mono<ChannelConfigDTO> createOrUpdateConfig(Long tenantId, Long companyId, ChannelConfigDTO dto) {
        log.info("💾 [CHANNEL-CONFIG-SERVICE] Saving config for tenantId: {}, companyId: {}", tenantId, companyId);
        return channelConfigRepository.findByTenantIdAndCompanyId(tenantId, companyId)
                .flatMap(config -> {
                    config.setUpdatedAt(LocalDateTime.now());
                    // Update fields from DTO if needed
                    if (dto.getIsActive() != null) config.setIsActive(dto.getIsActive());
                    if (dto.getN8nWebhookUrl() != null) config.setN8nWebhookUrl(dto.getN8nWebhookUrl());
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
