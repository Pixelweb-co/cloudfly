package com.app.starter1.persistence.services;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.ChatbotConfigRepository;
import com.app.starter1.persistence.repository.ContactRepository;
import com.app.starter1.persistence.repository.OmniChannelMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final OmniChannelMessageRepository messageRepository;
    private final ContactRepository contactRepository;
    private final EvolutionApiService evolutionApiService;
    private final ChatbotConfigRepository chatbotConfigRepository;

    /**
     * Obtener contactos agrupados por stage para una plataforma
     */
    @Transactional(readOnly = true)
    public ContactGroupDTO getContactsByPlatform(Long tenantId, MessagePlatform platform) {
        log.info("Getting contacts for tenant {} and platform {}", tenantId, platform);

        // Obtener últimos mensajes por conversación
        List<OmniChannelMessage> lastMessages = messageRepository.findLastMessagesByPlatform(tenantId, platform);

        // Crear mapa de cards agrupados por stage
        Map<String, List<ContactCardDTO>> groupedContacts = new HashMap<>();
        groupedContacts.put("LEAD", new ArrayList<>());
        groupedContacts.put("POTENTIAL", new ArrayList<>());
        groupedContacts.put("CLIENT", new ArrayList<>());

        for (OmniChannelMessage message : lastMessages) {
            if (message.getContactId() == null) {
                continue; // Skip messages sin contacto asociado
            }

            // Buscar contacto
            contactRepository.findById(message.getContactId()).ifPresent(contact -> {
                // Contar mensajes no leídos
                Integer unreadCount = messageRepository.countUnreadByConversation(
                        tenantId,
                        message.getInternalConversationId());

                ContactCardDTO card = ContactCardDTO.builder()
                        .contactId(contact.getId())
                        .name(contact.getName())
                        .avatarUrl(contact.getAvatarUrl())
                        .externalId(message.getExternalSenderId())
                        .lastMessage(message.getBody() != null ? message.getBody() : "[Media]")
                        .lastMessageTime(message.getCreatedAt())
                        .unreadCount(unreadCount)
                        .stage(contact.getStage() != null ? contact.getStage() : "LEAD")
                        .conversationId(message.getInternalConversationId())
                        .platform(platform.name())
                        .build();

                String stage = card.getStage();
                if (groupedContacts.containsKey(stage)) {
                    groupedContacts.get(stage).add(card);
                }
            });
        }

        // Ordenar por última actividad
        groupedContacts.values()
                .forEach(list -> list.sort((a, b) -> b.getLastMessageTime().compareTo(a.getLastMessageTime())));

        return ContactGroupDTO.of(groupedContacts);
    }

    /**
     * Obtener mensajes de una conversación con paginación
     */
    @Transactional(readOnly = true)
    public Page<MessageDTO> getMessages(Long tenantId, String conversationId, int page, int size) {
        log.info("Getting messages for conversation: {}", conversationId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").ascending());
        Page<OmniChannelMessage> messages = messageRepository.findByConversation(
                tenantId,
                conversationId,
                pageable);

        return messages.map(this::mapToDTO);
    }

    /**
     * Guardar mensaje nuevo (llamado por Socket.IO o Evolution API)
     */
    @Transactional
    public MessageDTO saveMessage(MessageCreateRequest request) {
        log.info("Saving new message for conversation: {}", request.getConversationId());

        OmniChannelMessage message = new OmniChannelMessage();
        message.setTenantId(request.getTenantId());
        message.setInternalConversationId(request.getConversationId());
        message.setFromUserId(request.getFromUserId());
        message.setDirection(MessageDirection.valueOf(request.getDirection()));
        message.setMessageType(MessageType.valueOf(request.getMessageType()));
        message.setBody(request.getBody());
        message.setMediaUrl(request.getMediaUrl());
        message.setPlatform(MessagePlatform.valueOf(request.getPlatform()));
        message.setProvider(MessageProvider.EVOLUTION);
        message.setTitle(request.getTitle());
        message.setExternalQuotedMessageId(request.getExternalQuotedMessageId());
        message.setStatus(MessageStatus.PENDING);
        message.setSentAt(LocalDateTime.now());
        message.setCreatedAt(LocalDateTime.now());

        // Buscar contacto basado en conversationId (extraer teléfono)
        String conversationId = request.getConversationId();
        String phone = extractPhoneFromConversation(conversationId);

        if (phone != null) {
            List<Contact> contacts = contactRepository.findByTenantIdAndPhoneContaining(
                    request.getTenantId().intValue(), phone);

            if (!contacts.isEmpty()) {
                message.setContactId(contacts.get(0).getId());
                log.debug("Message associated with contact ID: {}", contacts.get(0).getId());
            } else {
                log.warn("No contact found with phone: {}. Message saved without contact_id", phone);
            }
        } else {
            log.warn("Could not extract phone from conversation: {}", conversationId);
        }

        OmniChannelMessage saved = messageRepository.save(message);
        return mapToDTO(saved);
    }

    /**
     * Extraer teléfono del conversationId
     */
    private String extractPhoneFromConversation(String conversationId) {
        if (conversationId == null)
            return null;
        if (conversationId.startsWith("conv_")) {
            return conversationId.substring(5);
        }
        if (conversationId.matches("\\d+")) {
            return conversationId;
        }
        return null;
    }

    /**
     * Enviar mensaje a través de Evolution API
     */
    @Transactional
    public MessageDTO sendToEvolution(String conversationId, MessageCreateRequest request) {
        log.info("Sending message via Evolution API to conversation: {}", conversationId);

        // Guardar mensaje primero como PENDING
        MessageDTO savedMessage = saveMessage(request);

        try {
            // Obtener configuración del chatbot para el tenant
            Optional<ChatbotConfig> chatbotConfig = chatbotConfigRepository.findByTenantIdAndIsActive(
                    request.getTenantId(), true);

            if (chatbotConfig.isEmpty()) {
                log.warn("❌ No active chatbot configured for tenant {}. Message saved as PENDING.",
                        request.getTenantId());
                return savedMessage;
            }

            String instanceName = chatbotConfig.get().getInstanceName();
            log.info("📱 Using chatbot instance: {}", instanceName);

            // Extraer número de teléfono del conversationId
            String remoteJid = extractRemoteJid(conversationId);

            // Enviar via Evolution API
            Map<String, Object> evolutionResponse = evolutionApiService.sendMessage(
                    instanceName,
                    remoteJid,
                    request.getBody(),
                    request.getMediaUrl());

            // Actualizar mensaje con externalMessageId si está disponible
            if (evolutionResponse != null && evolutionResponse.containsKey("key")) {
                Map<String, Object> key = (Map<String, Object>) evolutionResponse.get("key");
                String externalMessageId = (String) key.get("id");

                OmniChannelMessage message = messageRepository.findById(savedMessage.getId())
                        .orElseThrow(() -> new RuntimeException("Message not found"));
                message.setExternalMessageId(externalMessageId);
                message.setStatus(MessageStatus.SENT);
                messageRepository.save(message);

                log.info("✅ Message sent successfully via Evolution API");
            }

            return savedMessage;

        } catch (Exception e) {
            log.error("❌ Error sending message via Evolution API: {}", e.getMessage());

            // El mensaje ya está guardado como PENDING, no lanzar error
            // Solo loguear para no romper el flujo
            OmniChannelMessage message = messageRepository.findById(savedMessage.getId())
                    .orElse(null);
            if (message != null) {
                message.setStatus(MessageStatus.FAILED);
                messageRepository.save(message);
            }

            return savedMessage;
        }
    }

    /**
     * Marcar mensajes como leídos
     */
    @Transactional
    public void markAsRead(List<Long> messageIds, Long tenantId) {
        log.info("Marking {} messages as read", messageIds.size());
        messageRepository.markAsRead(messageIds, tenantId);
    }

    /**
     * Actualizar stage de contacto (para drag & drop en Kanban)
     */
    @Transactional
    public void updateContactStage(Long contactId, Long tenantId, String newStage) {
        log.info("Updating contact {} stage to {}", contactId, newStage);

        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));

        // Validar que pertenece al tenant
        if (!contact.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Unauthorized");
        }

        contact.setStage(newStage);
        contactRepository.save(contact);
    }

    /**
     * Mapear entidad a DTO
     */
    private MessageDTO mapToDTO(OmniChannelMessage entity) {
        return MessageDTO.builder()
                .id(entity.getId())
                .conversationId(entity.getInternalConversationId())
                .contactId(entity.getContactId())
                .direction(entity.getDirection())
                .messageType(entity.getMessageType())
                .body(entity.getBody())
                .mediaUrl(entity.getMediaUrl())
                .title(entity.getTitle())
                .displayName(entity.getDisplayName())
                .status(entity.getStatus())
                .sentAt(entity.getSentAt())
                .deliveredAt(entity.getDeliveredAt())
                .readAt(entity.getReadAt())
                .createdAt(entity.getCreatedAt())
                .externalMessageId(entity.getExternalMessageId())
                .externalQuotedMessageId(entity.getExternalQuotedMessageId())
                .build();
    }

    /**
     * Extraer remoteJid del conversationId
     * Formato esperado: "573245640657@s.whatsapp.net"
     */
    private String extractRemoteJid(String conversationId) {
        // Implementar lógica según tu formato de conversationId
        // Por ahora, asumimos que conversationId ya contiene el formato correcto
        return conversationId;
    }
}
