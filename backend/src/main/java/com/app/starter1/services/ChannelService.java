package com.app.starter1.services;

import com.app.starter1.dto.ChannelCreateRequest;
import com.app.starter1.dto.ChannelDTO;
import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final CustomerRepository customerRepository;
    private final UserMethods userMethods;

    /**
     * Obtener todos los canales del tenant actual
     */
    @Transactional(readOnly = true)
    public List<ChannelDTO> getAllChannels() {
        Long tenantId = userMethods.getTenantId();
        log.info("Fetching channels for tenant: {}", tenantId);

        return channelRepository.findByCustomerId(tenantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
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
