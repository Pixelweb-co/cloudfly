const axios = require('axios');
const logger = require('../utils/logger');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'CAMBIA_ESTA_LLAVE_LARGA_Y_UNICA';

class EvolutionClient {
    constructor() {
        this.client = axios.create({
            baseURL: EVOLUTION_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY
            }
        });
    }

    /**
     * Enviar mensaje de texto
     */
    async sendMessage(instanceName, remoteJid, text) {
        try {
            const url = `/message/sendText/${instanceName}`;
            const body = {
                number: remoteJid,
                options: {
                    delay: 1200,
                    presence: 'composing',
                    linkPreview: false
                },
                text: text
            };

            logger.info(`📤 Sending WhatsApp message to ${remoteJid} via instance ${instanceName}`);
            const response = await this.client.post(url, body);
            return response.data;
        } catch (error) {
            logger.error(`❌ Error sending Evolution message: ${error.message}`);
            if (error.response) {
                logger.error('Error response data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Enviar Media (Imagen, Video, etc.)
     */
    async sendMedia(instanceName, remoteJid, mediaUrl, caption, type = 'image') {
        try {
            const url = `/message/sendMedia/${instanceName}`;
            const body = {
                number: remoteJid,
                mediatype: type,
                caption: caption,
                media: mediaUrl,
                fileName: mediaUrl.split('/').pop()
            };

            const response = await this.client.post(url, body);
            return response.data;
        } catch (error) {
            logger.error(`❌ Error sending Evolution media: ${error.message}`);
            if (error.response) {
                logger.error('Error response data:', error.response.data);
            }
            throw error;
        }
    }
    /**
     * Marcar mensaje como leído (Doble check azul)
     */
    async markRead(instanceName, remoteJid) {
        try {
            const url = `/chat/markMessageAsRead/${instanceName}`;
            // Evolution API v2+ uses this structure
            const body = {
                readMessages: [
                    {
                        remoteJid: remoteJid
                    }
                ]
            };

            await this.client.post(url, body);
            logger.info(`🔵 Read receipt sent to ${remoteJid}`);
        } catch (error) {
            logger.warn(`⚠️ Could not send read receipt to ${remoteJid}: ${error.message}`);
        }
    }

    /**
     * Establecer estado de presencia (escribiendo, grabado, etc.)
     */
    async setPresence(instanceName, remoteJid, presence = 'composing') {
        try {
            const url = `/chat/sendPresence/${instanceName}`;
            const body = {
                number: remoteJid,
                presence: presence,
                delay: 0
            };
            await this.client.post(url, body);
            logger.info(`✍️ Presence set to '${presence}' for ${remoteJid}`);
        } catch (error) {
            logger.warn(`⚠️ Could not set presence for ${remoteJid}: ${error.message}`);
        }
    }
}

module.exports = new EvolutionClient();
