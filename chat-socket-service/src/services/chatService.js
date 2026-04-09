const db = require('../utils/db');
const logger = require('../utils/logger');

class ChatService {
    /**
     * Procesar mensaje entrante de Evolution
     */
    async processEvolutionWebhook(io, payload) {
        const type = (payload.event || '').toUpperCase().replace(/\./g, '_');
        const instance = payload.instance;

        logger.info(`📥 [WEBHOOK] Received event: ${payload.event} (normalized: ${type}) from instance: ${instance}`);

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
            const channelId = channel.id;

            // 2. Buscar o crear el contacto
            let contact = await this.getOrCreateContact(tenantId, companyId, remoteJid, pushName);
            
            // 3. Guardar el mensaje
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, channel_id, contact_id, direction, content, status, external_msg_id, created_at) 
                VALUES (?, ?, ?, 'INBOUND', ?, 'RECEIVED', ?, NOW())`,
                [tenantId, channelId, contact.id, body, data.key.id || null]
            );

            const messageId = result.insertId;
            logger.info(`✅ [WEBHOOK] Message saved (ID: ${messageId})`);

            // 4. Obtener últimos 10 mensajes
            const [history] = await db.execute(
                `SELECT * FROM omni_channel_messages 
                WHERE tenant_id = ? AND contact_id = ? 
                ORDER BY created_at DESC LIMIT 10`,
                [tenantId, contact.id]
            );

            // 5. Emitir por Socket.IO usando el teléfono (para soportar duplicados)
            const phoneDigits = remoteJid.split('@')[0].replace(/\D/g, '');
            const roomName = `tenant_${tenantId}_contact_${phoneDigits}`;
            const eventPayload = {
                message: {
                    id: messageId,
                    content: body,
                    direction: 'INBOUND',
                    status: 'RECEIVED',
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
     * Lógica de obtener o crear contacto (con UUID y protección contra duplicados)
     */
    async getOrCreateContact(tenantId, companyId, jid, name) {
        const phone = jid.split('@')[0];
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        try {
            // 1. Buscar contacto existente por teléfono
            const [contacts] = await db.execute(
                'SELECT * FROM contacts WHERE tenant_id = ? AND company_id = ? AND phone = ? LIMIT 1',
                [tenantId, companyId, cleanPhone]
            );

            if (contacts.length > 0) {
                logger.info(`📇 [WEBHOOK] Contact found: ${contacts[0].name} (ID: ${contacts[0].id}, UUID: ${contacts[0].uuid})`);
                return contacts[0];
            }

            // 2. No existe: crear contacto nuevo con UUID
            const contactName = name ? `${name} (${cleanPhone})` : `Nuevo Contacto ${cleanPhone}`;
            const contactUuid = require('crypto').randomUUID();
            
            try {
                const [result] = await db.execute(
                    `INSERT INTO contacts 
                    (uuid, name, phone, type, stage, is_active, tenant_id, company_id, created_at, updated_at) 
                    VALUES (?, ?, ?, 'LEAD', 'LEAD', 1, ?, ?, NOW(), NOW())`,
                    [contactUuid, contactName, cleanPhone, tenantId, companyId]
                );

                const [newContacts] = await db.execute('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
                logger.info(`🆕 [WEBHOOK] New contact created: ${contactName} (ID: ${result.insertId}, UUID: ${contactUuid})`);
                return newContacts[0];

            } catch (insertError) {
                // 3. Si falla por duplicado (race condition), recuperar el existente
                if (insertError.code === 'ER_DUP_ENTRY') {
                    logger.warn(`⚠️ [WEBHOOK] Duplicate phone detected, recovering existing contact: ${cleanPhone}`);
                    const [existing] = await db.execute(
                        'SELECT * FROM contacts WHERE tenant_id = ? AND company_id = ? AND phone = ? LIMIT 1',
                        [tenantId, companyId, cleanPhone]
                    );
                    return existing[0];
                }
                throw insertError;
            }

        } catch (error) {
            logger.error(`❌ [WEBHOOK] Error in getOrCreateContact: ${error.message}`);
            throw error;
        }
    }

    /**
     * Guardar mensaje saliente (usando columnas reales)
     */
    async saveOutboundMessage(tenantId, channelId, contactId, body) {
        try {
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, channel_id, contact_id, direction, content, status, created_at) 
                VALUES (?, ?, ?, 'OUTBOUND', ?, 'SENT', NOW())`,
                [tenantId, channelId, contactId, body]
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

    /**
     * Obtener historial de mensajes de un contacto
     */
    async getMessageHistory(tenantId, contactId, limit = 10) {
        try {
            const safeLimit = parseInt(limit) || 10;
            const [messages] = await db.execute(
                `SELECT m.*, c.name as contact_name, c.phone as contact_phone
                FROM omni_channel_messages m
                LEFT JOIN contacts c ON m.contact_id = c.id
                WHERE m.tenant_id = ? AND m.contact_id = ?
                ORDER BY m.created_at DESC LIMIT ${safeLimit}`,
                [tenantId, contactId]
            );
            return messages.reverse();
        } catch (error) {
            logger.error(`❌ [CHAT-SERVICE] Error getting message history: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener contactos que tienen mensajes (conversaciones activas)
     */
    async getContactsWithMessages(tenantId) {
        try {
            const [contacts] = await db.execute(
                `SELECT c.*, 
                    (SELECT content FROM omni_channel_messages 
                     WHERE contact_id = c.id AND tenant_id = ? 
                     ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM omni_channel_messages 
                     WHERE contact_id = c.id AND tenant_id = ? 
                     ORDER BY created_at DESC LIMIT 1) as last_message_at,
                    (SELECT COUNT(*) FROM omni_channel_messages 
                     WHERE contact_id = c.id AND tenant_id = ? 
                     AND status = 'RECEIVED') as unread_count
                FROM contacts c
                WHERE c.tenant_id = ?
                AND EXISTS (SELECT 1 FROM omni_channel_messages WHERE contact_id = c.id AND tenant_id = ?)
                ORDER BY last_message_at DESC`,
                [tenantId, tenantId, tenantId, tenantId, tenantId]
            );
            return contacts;
        } catch (error) {
            logger.error(`❌ [CHAT-SERVICE] Error getting contacts with messages: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ChatService();
