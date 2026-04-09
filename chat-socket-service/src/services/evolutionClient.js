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
                mediaMessage: {
                    mediatype: type,
                    caption: caption,
                    media: mediaUrl
                }
            };

            const response = await this.client.post(url, body);
            return response.data;
        } catch (error) {
            logger.error(`❌ Error sending Evolution media: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EvolutionClient();
