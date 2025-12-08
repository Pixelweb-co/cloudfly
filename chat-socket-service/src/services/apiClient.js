const axios = require('axios');
const logger = require('../utils/logger');

const JAVA_API_URL = process.env.JAVA_API_URL || 'http://localhost:8080';

/**
 * Cliente HTTP para comunicarse con el backend Java
 */
class ApiClient {
    constructor() {
        this.client = axios.create({
            baseURL: JAVA_API_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Guardar mensaje enviado por el usuario
     */
    async saveMessage(messageData, userToken) {
        try {
            const response = await this.client.post('/api/chat/messages', messageData, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });
            logger.info(`Message saved: ${response.data.id}`);
            return response.data;
        } catch (error) {
            logger.error(`Error saving message: ${error.message}`);
            throw error;
        }
    }

    /**
     * Enviar mensaje a través de Evolution API
     */
    async sendToEvolution(conversationId, messageData, userToken) {
        try {
            const response = await this.client.post(
                `/api/chat/send/${conversationId}`,
                messageData,
                {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                }
            );
            logger.info(`Message sent via Evolution API: ${response.data.id}`);
            return response.data;
        } catch (error) {
            logger.error(`Error sending message via Evolution: ${error.message}`);
            throw error;
        }
    }

    /**
     * Marcar mensajes como leídos
     */
    async markAsRead(messageIds, userToken) {
        try {
            await this.client.patch('/api/chat/messages/read',
                { messageIds },
                {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                }
            );
            logger.info(`Marked ${messageIds.length} messages as read`);
        } catch (error) {
            logger.error(`Error marking messages as read: ${error.message}`);
        }
    }

    /**
     * Actualizar estado de typing
     */
    async updateTypingStatus(conversationId, isTyping, userToken) {
        try {
            await this.client.post('/api/chat/typing',
                { conversationId, isTyping },
                {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                }
            );
        } catch (error) {
            // No crítico, solo log
            logger.debug(`Error updating typing status: ${error.message}`);
        }
    }
}

module.exports = new ApiClient();
