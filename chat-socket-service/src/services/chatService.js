const db = require('../utils/db');
const logger = require('../utils/logger');

class ChatService {
    /**
     * Procesar mensaje entrante de Evolution
     */
    async processEvolutionWebhook(io, payload) {
        const type = payload.event;
        const instance = payload.instance;

        if (type !== 'MESSAGES_UPSERT') {
            return;
        }

        const data = payload.data;
        const message = data.message;
        
        // Extract remoteJid (conversationId)
        let remoteJid = data.key.remoteJid;
        const pushName = data.pushName;

        // Extract body
        let body = '';
        if (message) {
            if (message.conversation) {
                body = message.conversation;
            } else if (message.extendedTextMessage) {
                body = message.extendedTextMessage.text;
            }
        }

        logger.info(`📥 [WEBHOOK] Processing message from ${pushName} (${remoteJid}) on instance ${instance}`);

        try {
            // 1. Encontrar el canal (Channel) para obtener tenantId y companyId
            const [channels] = await db.execute(
                'SELECT id, tenant_id, company_id FROM channels WHERE instance_name = ? LIMIT 1',
                [instance]
            );

            if (channels.length === 0) {
                logger.warn(`⚠️ [WEBHOOK] No channel found for instance: ${instance}`);
                return;
            }

            const channel = channels[0];
            const tenantId = channel.tenant_id;
            const companyId = channel.company_id;

            // 2. Buscar o crear el contacto
            let contact = await this.getOrCreateContact(tenantId, companyId, remoteJid, pushName);
            
            // 3. Guardar el mensaje
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, internal_conversation_id, contact_id, direction, message_type, body, platform, provider, status, created_at) 
                VALUES (?, ?, ?, 'INBOUND', 'TEXT', ?, 'WHATSAPP', 'EVOLUTION', 'RECEIVED', NOW())`,
                [tenantId, remoteJid, contact.id, body]
            );

            const messageId = result.insertId;
            logger.info(`✅ [WEBHOOK] Message saved (ID: ${messageId})`);

            // 4. Obtener últimos 10 mensajes
            const [history] = await db.execute(
                `SELECT * FROM omni_channel_messages 
                WHERE tenant_id = ? AND internal_conversation_id = ? 
                ORDER BY created_at DESC LIMIT 10`,
                [tenantId, remoteJid]
            );

            // 5. Emitir por Socket.IO
            const roomName = `tenant_${tenantId}_conv_${remoteJid}`;
            const eventPayload = {
                message: {
                    id: messageId,
                    body,
                    direction: 'INBOUND',
                    createdAt: new Date()
                },
                contact: contact,
                history: history.reverse()
            };

            io.to(roomName).emit('new-message', eventPayload);
            logger.info(`📡 [WEBHOOK] Socket event emitted to room: ${roomName}`);

        } catch (error) {
            logger.error(`❌ [WEBHOOK] Error processing webhook logic: ${error.message}`);
            logger.error(error.stack);
        }
    }

    /**
     * Lógica de obtener o crear contacto
     */
    async getOrCreateContact(tenantId, companyId, jid, name) {
        const phone = jid.split('@')[0];
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        try {
            // Buscar contacto
            const [contacts] = await db.execute(
                'SELECT * FROM contacts WHERE tenant_id = ? AND company_id = ? AND phone = ? LIMIT 1',
                [tenantId, companyId, cleanPhone]
            );

            if (contacts.length > 0) {
                return contacts[0];
            }

            // Crear contacto nuevo
            const contactName = name ? `${name} (${cleanPhone})` : `Nuevo Contacto ${cleanPhone}`;
            
            const [result] = await db.execute(
                `INSERT INTO contacts 
                (name, phone, type, stage, is_active, tenant_id, company_id, created_at, updated_at) 
                VALUES (?, ?, 'LEAD', 'LEAD', 1, ?, ?, NOW(), NOW())`,
                [contactName, cleanPhone, tenantId, companyId]
            );

            const [newContacts] = await db.execute('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
            logger.info(`🆕 [WEBHOOK] New contact created: ${contactName}`);
            return newContacts[0];

        } catch (error) {
            logger.error(`❌ [WEBHOOK] Error in getOrCreateContact: ${error.message}`);
            throw error;
        }
    }

    /**
     * Guardar mensaje saliente
     */
    async saveOutboundMessage(tenantId, conversationId, contactId, fromUserId, body, platform) {
        try {
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, internal_conversation_id, contact_id, from_user_id, direction, message_type, body, platform, provider, status, created_at) 
                VALUES (?, ?, ?, ?, 'OUTBOUND', 'TEXT', ?, ?, 'EVOLUTION', 'SENT', NOW())`,
                [tenantId, conversationId, contactId, fromUserId, body, platform || 'WHATSAPP']
            );

            const [newMessages] = await db.execute('SELECT * FROM omni_channel_messages WHERE id = ?', [result.insertId]);
            return newMessages[0];
        } catch (error) {
            logger.error(`❌ [CHAT-SERVICE] Error saving outbound message: ${error.message}`);
            throw error;
        }
    }
    /**
     * Obtener el canal de WhatsApp activo para un tenant
     */
    async getChannelForOutbound(tenantId) {
        try {
            const [channels] = await db.execute(
                "SELECT * FROM channels WHERE tenant_id = ? AND platform = 'WHATSAPP' AND status = 1 LIMIT 1",
                [tenantId]
            );
            return channels[0];
        } catch (error) {
            logger.error(`❌ [CHAT-SERVICE] Error getting channel: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ChatService();
