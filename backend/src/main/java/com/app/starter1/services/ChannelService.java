package com.app.starter1.services;

import com.app.starter1.dto.ChannelCreateRequest;
import com.app.starter1.dto.ChannelDTO;
import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.persistence.repository.ChatbotConfigRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.services.EvolutionApiService;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final CustomerRepository customerRepository;
    private final ChatbotConfigRepository chatbotConfigRepository;
    private final EvolutionApiService evolutionApiService;
    private final UserMethods userMethods;

    /**
     * Obtener todos los canales del tenant actual
     * Sincroniza el estado real desde Evolution API para WhatsApp
     */
    @Transactional
    public List<ChannelDTO> getAllChannels() {
        Long tenantId = userMethods.getTenantId();
        log.info("Fetching channels for tenant: {}", tenantId);

        List<Channel> channels = channelRepository.findByCustomerId(tenantId);

        // Sincronizar estado de canales WhatsApp
        for (Channel channel : channels) {
            if (channel.getType() == Channel.ChannelType.WHATSAPP && channel.getInstanceName() != null) {
                syncWhatsAppChannelStatus(channel);
            }
        }

        return channels.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Sincroniza el estado de un canal WhatsApp con Evolution API
     */
    private void syncWhatsAppChannelStatus(Channel channel) {
        try {
            log.info("🔄 [SYNC] Syncing status for channel {} (instance: {})",
                    channel.getId(), channel.getInstanceName());

            Map<String, Object> status = evolutionApiService.checkInstanceStatus(channel.getInstanceName());

            if (status != null) {
                log.info("📊 [SYNC] Evolution API returned status for instance {}", channel.getInstanceName());

                // La instancia existe en Evolution API
                // Intentar obtener el estado de diferentes formas según la estructura de la
                // respuesta
                Object stateObj = status.get("state");

                // Si no hay "state" directo, buscar en "instance.state" o similar
                if (stateObj == null && status.containsKey("instance")) {
                    Object instance = status.get("instance");
                    if (instance instanceof Map) {
                        stateObj = ((Map<?, ?>) instance).get("state");
                    }
                }

                log.info("🔍 [SYNC] State value for {}: {}", channel.getInstanceName(), stateObj);

                // Verificar si está conectado (puede ser "open", "connected", etc.)
                boolean connected = false;
                if (stateObj != null) {
                    String stateStr = stateObj.toString().toLowerCase();
                    connected = stateStr.equals("open") ||
                            stateStr.equals("connected") ||
                            stateStr.contains("connect");
                }

                log.info("🎯 [SYNC] Determined connection status for {}: {}",
                        channel.getInstanceName(), connected);

                if (channel.getIsConnected() != connected) {
                    log.info("📊 [SYNC] Updating channel {} connection status: {} -> {}",
                            channel.getId(), channel.getIsConnected(), connected);
                    channel.setIsConnected(connected);
                    if (connected) {
                        channel.setLastSync(LocalDateTime.now());
                        channel.setLastError(null);
                    } else {
                        channel.setLastError("Instance state: " + stateObj);
                    }
                    channelRepository.save(channel);
                } else {
                    log.info("✓ [SYNC] Channel {} status unchanged: {}",
                            channel.getId(), connected);
                }
            } else {
                // La instancia NO existe en Evolution API
                log.warn("⚠️ [SYNC] No status returned for instance {}", channel.getInstanceName());
                handleMissingInstance(channel);
            }
        } catch (Exception e) {
            // La instancia NO existe (404 u otro error)
            log.error("❌ [SYNC] Error checking instance {}: {}",
                    channel.getInstanceName(), e.getMessage(), e);
            handleMissingInstance(channel);
        }
    }

    /**
     * Maneja el caso cuando la instancia no existe en Evolution API
     */
    private void handleMissingInstance(Channel channel) {
        log.warn("🗑️ [SYNC] Instance {} does not exist, cleaning up configuration", channel.getInstanceName());

        // Eliminar configuración de chatbot_config si existe
        chatbotConfigRepository.findByTenantId(channel.getCustomer().getId())
                .ifPresent(config -> {
                    if (channel.getInstanceName().equals(config.getInstanceName())) {
                        log.info("🗑️ [SYNC] Deleting orphaned chatbot config for instance: {}",
                                config.getInstanceName());
                        chatbotConfigRepository.delete(config);
                    }
                });

        // Marcar canal como desconectado
        if (channel.getIsConnected()) {
            log.info("📊 [SYNC] Marking channel {} as disconnected", channel.getId());
            channel.setIsConnected(false);
            channel.setLastError("Instance not found in Evolution API");
            channelRepository.save(channel);
        }
    }

    /**
     * Obtener canales activos del tenant
     */
    @Transactional(readOnly = true)
    public List<ChannelDTO> getActiveChannels() {
        Long tenantId = userMethods.getTenantId();
        return channelRepository.findByCustomerIdAndIsActive(tenantId, true).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener un canal por ID
     */
    @Transactional(readOnly = true)
    public ChannelDTO getChannelById(Long id) {
        Long tenantId = userMethods.getTenantId();
        Channel channel = channelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canal no encontrado: " + id));

        // Verificar que pertenece al tenant
        if (!channel.getCustomer().getId().equals(tenantId)) {
            throw new RuntimeException("Acceso denegado al canal");
        }

        return mapToDTO(channel);
    }

    /**
     * Crear un nuevo canal
     */
    @Transactional
    public ChannelDTO createChannel(ChannelCreateRequest request) {
        Long tenantId = userMethods.getTenantId();
        log.info("Creating {} channel for tenant: {}", request.type(), tenantId);

        // Verificar si ya existe un canal de este tipo
        if (channelRepository.existsByCustomerIdAndType(tenantId, request.type())) {
            throw new RuntimeException("Ya existe un canal de tipo " + request.type() + " para este tenant");
        }

        Customer customer = customerRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Customer no encontrado: " + tenantId));

        // Generar nombre por defecto si no se proporciona
        String channelName = request.name() != null ? request.name() : getDefaultChannelName(request.type());

        // Para WhatsApp, generar instanceName automáticamente
        String instanceName = request.instanceName();
        if (request.type() == Channel.ChannelType.WHATSAPP) {
            instanceName = "cloudfly_" + tenantId;
        }

        Channel channel = Channel.builder()
                .customer(customer)
                .type(request.type())
                .name(channelName)
                .isActive(false) // Inactivo hasta que se conecte
                .isConnected(false)
                .phoneNumber(request.phoneNumber())
                .pageId(request.pageId())
                .username(request.username())
                .accessToken(request.accessToken())
                .instanceName(instanceName)
                .webhookUrl(request.webhookUrl())
                .apiKey(request.apiKey())
                .configuration(request.configuration())
                .build();

        Channel saved = channelRepository.save(channel);
        log.info("Channel created successfully: {}", saved.getId());

        return mapToDTO(saved);
    }

    /**
     * Actualizar un canal existente
     */
    @Transactional
    public ChannelDTO updateChannel(Long id, ChannelCreateRequest request) {
        Long tenantId = userMethods.getTenantId();
        Channel channel = channelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canal no encontrado: " + id));

        // Verificar que pertenece al tenant
        if (!channel.getCustomer().getId().equals(tenantId)) {
            throw new RuntimeException("Acceso denegado al canal");
        }

        // Actualizar campos
        if (request.name() != null) {
            channel.setName(request.name());
        }
        if (request.phoneNumber() != null) {
            channel.setPhoneNumber(request.phoneNumber());
        }
        if (request.pageId() != null) {
            channel.setPageId(request.pageId());
        }
        if (request.username() != null) {
            channel.setUsername(request.username());
        }
        if (request.accessToken() != null) {
            channel.setAccessToken(request.accessToken());
        }
        if (request.instanceName() != null) {
            channel.setInstanceName(request.instanceName());
        }
        if (request.webhookUrl() != null) {
            channel.setWebhookUrl(request.webhookUrl());
        }
        if (request.apiKey() != null) {
            channel.setApiKey(request.apiKey());
        }
        if (request.configuration() != null) {
            channel.setConfiguration(request.configuration());
        }

        Channel updated = channelRepository.save(channel);
        log.info("Channel updated: {}", id);

        return mapToDTO(updated);
    }

    /**
     * Activar/Desactivar un canal
     */
    @Transactional
    public ChannelDTO toggleActive(Long id) {
        Long tenantId = userMethods.getTenantId();
        Channel channel = channelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canal no encontrado: " + id));

        // Verificar que pertenece al tenant
        if (!channel.getCustomer().getId().equals(tenantId)) {
            throw new RuntimeException("Acceso denegado al canal");
        }

        channel.setIsActive(!channel.getIsActive());
        Channel updated = channelRepository.save(channel);

        log.info("Channel {} toggled to: {}", id, updated.getIsActive() ? "ACTIVE" : "INACTIVE");

        return mapToDTO(updated);
    }

    /**
     * Actualizar estado de conexión
     */
    @Transactional
    public ChannelDTO updateConnectionStatus(Long id, boolean isConnected, String error) {
        Long tenantId = userMethods.getTenantId();
        Channel channel = channelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canal no encontrado: " + id));

        // Verificar que pertenece al tenant
        if (!channel.getCustomer().getId().equals(tenantId)) {
            throw new RuntimeException("Acceso denegado al canal");
        }

        channel.setIsConnected(isConnected);
        if (isConnected) {
            channel.setLastSync(LocalDateTime.now());
            channel.setLastError(null);
        } else {
            channel.setLastError(error);
        }

        Channel updated = channelRepository.save(channel);
        log.info("Channel {} connection status updated to: {}", id, isConnected);

        return mapToDTO(updated);
    }

    /**
     * Eliminar un canal
     */
    @Transactional
    public void deleteChannel(Long id) {
        Long tenantId = userMethods.getTenantId();
        Channel channel = channelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canal no encontrado: " + id));

        // Verificar que pertenece al tenant
        if (!channel.getCustomer().getId().equals(tenantId)) {
            throw new RuntimeException("Acceso denegado al canal");
        }

        channelRepository.delete(channel);
        log.info("Channel deleted: {}", id);
    }

    // ==================== Métodos Privados ====================

    private ChannelDTO mapToDTO(Channel channel) {
        return new ChannelDTO(
                channel.getId(),
                channel.getCustomer().getId(),
                channel.getType(),
                channel.getName(),
                channel.getIsActive(),
                channel.getIsConnected(),
                channel.getPhoneNumber(),
                channel.getPageId(),
                channel.getUsername(),
                channel.getInstanceName(),
                channel.getWebhookUrl(),
                channel.getLastSync(),
                channel.getLastError(),
                channel.getCreatedAt(),
                channel.getUpdatedAt());
    }

    private String getDefaultChannelName(Channel.ChannelType type) {
        return switch (type) {
            case WHATSAPP -> "WhatsApp Business";
            case FACEBOOK -> "Facebook Messenger";
            case INSTAGRAM -> "Instagram Direct";
            case TIKTOK -> "TikTok Business";
        };
    }
}
