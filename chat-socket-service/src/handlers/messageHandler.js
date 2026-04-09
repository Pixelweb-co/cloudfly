const evolutionClient = require('../services/evolutionClient');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');

/**
 * Manejador de eventos relacionados con mensajes
 */
class MessageHandler {
    /**
     * Manejar envío de mensaje por parte del usuario (Directo a Evolution API)
     */
    handleSendMessage(socket, io) {
        return async (data) => {
            try {
                const { contactUuid, body, messageType = 'TEXT' } = data;
                const tenantId = socket.tenantId;

                logger.info(`User ${socket.userId} sending DIRECT message to contact UUID: ${contactUuid}`);

                // 1. Obtener el contacto por UUID para saber su teléfono (JID) e ID real
                const [contacts] = await require('../utils/db').execute(
                    'SELECT id, phone, uuid FROM contacts WHERE uuid = ? AND tenant_id = ? LIMIT 1',
                    [contactUuid, tenantId]
                );

                if (contacts.length === 0) {
                    return socket.emit('error', { message: 'Contact not found' });
                }

                const contact = contacts[0];
                const remoteJid = contact.phone.includes('@') ? contact.phone : `${contact.phone}@s.whatsapp.net`;

                // 2. Obtener canal para saber el nombre de la instancia
                const channel = await chatService.getChannelForOutbound(tenantId);
                if (!channel) {
                    return socket.emit('error', { message: 'No active WhatsApp channel found for this tenant' });
                }

                // 3. Enviar a Evolution API directamente
                await evolutionClient.sendMessage(channel.instance_name, remoteJid, body);

                // 4. Guardar en BD Cloudfly directamente
                const savedMessage = await chatService.saveOutboundMessage(
                    tenantId,
                    channel.id,
                    contact.id,
                    body
                );

                // 5. Broadcast a todos los sockets en la room del contacto
                const roomName = `tenant_${tenantId}_contact_${contact.uuid}`;
                
                const eventPayload = {
                    message: {
                        id: savedMessage.id,
                        content: savedMessage.content,
                        direction: 'OUTBOUND',
                        status: 'SENT',
                        createdAt: savedMessage.created_at
                    },
                    contact: contact
                };

                io.to(roomName).emit('new-message', eventPayload);
                logger.info(`✅ Message ${savedMessage.id} sent via Evolution and broadcasted to room: ${roomName}`);

            } catch (error) {
                logger.error(`❌ Error handling send message: ${error.message}`);
                socket.emit('error', {
                    message: 'Failed to send message',
                    details: error.message
                });
            }
        };
    }

    /**
     * Manejar marcado de mensajes como leídos
     */
    handleMarkAsRead(socket, io) {
        return async (data) => {
            try {
                const { messageIds, contactUuid } = data;
                const roomName = `tenant_${socket.tenantId}_contact_${contactUuid}`;
                
                socket.to(roomName).emit('messages-read', {
                    messageIds,
                    readBy: socket.userId,
                    readAt: new Date().toISOString()
                });

                logger.debug(`Messages marked as read in socket room: ${roomName}`);
            } catch (error) {
                logger.error(`Error marking messages as read: ${error.message}`);
            }
        };
    }
}

module.exports = new MessageHandler();
