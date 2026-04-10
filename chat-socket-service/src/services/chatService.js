const db = require('../utils/db');
const logger = require('../utils/logger');
const conversationService = require('./conversationService');
const chatbotGateService = require('./chatbotGateService');
const messageBufferService = require('./messageBufferService');
const evolutionClient = require('./evolutionClient');

class ChatService {
    /**
     * Procesar mensaje entrante de Evolution
     * FLOW: Save → Conversation ID → Socket.IO → Chatbot Gate → Buffer/Kafka
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

            // 3. Obtener o crear conversation_id (UUID, 30 min gap)
            const conversationId = await conversationService.getOrCreateConversationId(tenantId, contact.id, channelId);
            
            // 4. Guardar el mensaje CON conversation_id
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, channel_id, contact_id, direction, content, status, external_msg_id, conversation_id, created_at) 
                VALUES (?, ?, ?, 'INBOUND', ?, 'RECEIVED', ?, ?, NOW())`,
                [tenantId, channelId, contact.id, body, data.key.id || null, conversationId]
            );

            const messageId = result.insertId;
            logger.info(`✅ [WEBHOOK] Message saved (ID: ${messageId}, conv: ${conversationId.substring(0, 8)}...)`);

            // 5. Obtener últimos 10 mensajes
            const [history] = await db.execute(
                `SELECT * FROM omni_channel_messages 
                WHERE tenant_id = ? AND contact_id = ? 
                ORDER BY created_at DESC LIMIT 10`,
                [tenantId, contact.id]
            );

            // 6. Emitir por Socket.IO (SIEMPRE, independiente del chatbot gate)
            const phoneDigits = remoteJid.split('@')[0].replace(/\D/g, '');
            const roomName = `tenant_${tenantId}_contact_${phoneDigits}`;
            const eventPayload = {
                message: {
                    id: messageId,
                    content: body,
                    direction: 'INBOUND',
                    status: 'RECEIVED',
                    conversationId: conversationId,
                    createdAt: new Date()
                },
                contact: contact,
                history: history.reverse()
            };

            io.to(roomName).emit('new-message', eventPayload);
            logger.info(`📡 [WEBHOOK] Socket event emitted to room: ${roomName}`);

            // 7. CHATBOT GATE: Check if chatbot is enabled for this contact
            try {
                const chatbotEnabled = await chatbotGateService.isChatbotEnabled(tenantId, contact.id);

                if (chatbotEnabled) {
                    // Buffer the message (3s debounce → Kafka)
                    const buffered = await messageBufferService.bufferMessage(
                        tenantId, companyId, contact.id, conversationId,
                        { body, messageId, timestamp: new Date().toISOString() }
                    );

                    if (buffered) {
                        logger.info(`📦 [WEBHOOK] Message ${messageId} buffered for AI processing (chatbot=ON)`);
                    } else {
                        logger.warn(`⚠️ [WEBHOOK] Buffer failed for message ${messageId}, continuing without Kafka`);
                    }
                } else {
                    logger.info(`👤 [WEBHOOK] Chatbot OFF for contact ${contact.id} — human-only mode (no buffer/Kafka)`);
                }
            } catch (gateError) {
                // Fallback: if gate/buffer fails, the message is already saved and emitted via socket
                logger.error(`❌ [WEBHOOK] Chatbot gate/buffer error (non-fatal): ${gateError.message}`);
            }

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

    /**
     * Procesar respuesta generada por la IA (desde Kafka messages.out)
     */
    async processAiResponse(payload) {
        const { tenantId, contactId, conversationId, respuesta } = payload;
        
        logger.info(`🤖 [AI-RESPONSE] Processing response for contact ${contactId} in conv ${conversationId.substring(0, 8)}...`);

        try {
            // 1. Obtener información del contacto para notificar al frontend y canal
            const [contacts] = await db.execute('SELECT * FROM contacts WHERE id = ? AND tenant_id = ?', [contactId, tenantId]);
            if (contacts.length === 0) {
                logger.error(`❌ [AI-RESPONSE] Contact ${contactId} not found`);
                return;
            }
            const contact = contacts[0];

            // 2. Obtener canal activo (Evolution instance)
            const channel = await this.getChannelForOutbound(tenantId);
            if (!channel) {
                logger.error(`❌ [AI-RESPONSE] No active channel found for tenant ${tenantId}`);
                return;
            }

            // 3. Guardar en base de datos
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, channel_id, contact_id, direction, content, status, conversation_id, created_at) 
                VALUES (?, ?, ?, 'OUTBOUND', ?, 'SENT', ?, NOW())`,
                [tenantId, channel.id, contactId, respuesta, conversationId]
            );

            const messageId = result.insertId;

            // 4. Enviar vía WhatsApp (Evolution API)
            try {
                const remoteJid = `${contact.phone}@s.whatsapp.net`;
                await evolutionClient.sendMessage(channel.instance_name, remoteJid, respuesta);
                logger.info(`✅ [AI-RESPONSE] Message sent to WhatsApp for contact ${contactId}`);
            } catch (evError) {
                logger.error(`❌ [AI-RESPONSE] Error sending to Evolution API: ${evError.message}`);
                // No retornamos, igual notificamos al socket que "quedó" en DB o falló el envío
            }

            // 5. Notificar al Frontend vía Socket.IO
            const roomName = `tenant_${tenantId}_contact_${contact.phone}`;
            const eventPayload = {
                message: {
                    id: messageId,
                    content: respuesta,
                    direction: 'OUTBOUND',
                    status: 'SENT',
                    conversationId: conversationId,
                    createdAt: new Date()
                },
                contact: contact
            };

            // Necesitamos el objeto 'io' – pasaremos esto desde el receptor o lo inyectaremos
            // Por ahora asumimos que ChatService tiene acceso o lo recibe el método
            // Si no lo tiene, lo emitimos globalmente si es necesario o ajustamos el index.js
            return eventPayload;

        } catch (error) {
            logger.error(`❌ [AI-RESPONSE] Critical error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ChatService();
