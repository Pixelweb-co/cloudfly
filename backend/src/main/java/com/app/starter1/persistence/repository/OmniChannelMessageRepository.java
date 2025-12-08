package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.MessagePlatform;
import com.app.starter1.persistence.entity.OmniChannelMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OmniChannelMessageRepository extends JpaRepository<OmniChannelMessage, Long> {

    /**
     * Obtener mensajes de una conversación específica con paginación
     */
    @Query("SELECT m FROM OmniChannelMessage m " +
            "WHERE m.tenantId = :tenantId " +
            "AND m.internalConversationId = :conversationId " +
            "ORDER BY m.createdAt ASC")
    Page<OmniChannelMessage> findByConversation(
            @Param("tenantId") Long tenantId,
            @Param("conversationId") String conversationId,
            Pageable pageable);

    /**
     * Contar mensajes no leídos en una conversación
     */
    @Query("SELECT COUNT(m) FROM OmniChannelMessage m " +
            "WHERE m.tenantId = :tenantId " +
            "AND m.internalConversationId = :conversationId " +
            "AND m.direction = 'INBOUND' " +
            "AND m.readAt IS NULL")
    Integer countUnreadByConversation(
            @Param("tenantId") Long tenantId,
            @Param("conversationId") String conversationId);

    /**
     * Obtener último mensaje de cada conversación para un tenant y plataforma
     */
    @Query("SELECT m FROM OmniChannelMessage m " +
            "WHERE m.id IN (" +
            "  SELECT MAX(m2.id) FROM OmniChannelMessage m2 " +
            "  WHERE m2.tenantId = :tenantId " +
            "  AND m2.platform = :platform " +
            "  GROUP BY m2.internalConversationId" +
            ") " +
            "ORDER BY m.createdAt DESC")
    List<OmniChannelMessage> findLastMessagesByPlatform(
            @Param("tenantId") Long tenantId,
            @Param("platform") MessagePlatform platform);

    /**
     * Buscar mensajes por ID externo (para evitar duplicados)
     */
    Optional<OmniChannelMessage> findByExternalMessageId(String externalMessageId);

    /**
     * Marcar mensajes como leídos
     */
    @Query("UPDATE OmniChannelMessage m " +
            "SET m.readAt = CURRENT_TIMESTAMP " +
            "WHERE m.id IN :messageIds " +
            "AND m.tenantId = :tenantId")
    void markAsRead(@Param("messageIds") List<Long> messageIds, @Param("tenantId") Long tenantId);
}
