const db = require('../utils/db');
const logger = require('../utils/logger');
const conversationService = require('./conversationService');
const chatbotGateService = require('./chatbotGateService');
const messageBufferService = require('./messageBufferService');
const evolutionClient = require('./evolutionClient');
const kafkaProducer = require('./kafkaProducer');

class ChatService {
    /**
     * Procesar mensaje entrante de Evolution
     * FLOW: Save → Conversation ID → Socket.IO → Chatbot Gate → Buffer/Kafka
     */
    async processEvolutionWebhook(io, payload) {
        const type = (payload.event || '').toUpperCase().replace(/\./g, '_');
        const instance = payload.instance;

        logger.info(`📥 [WEBHOOK_START] Incoming event: ${payload.event} | Instance: ${instance}`);

        if (type === 'CONNECTION_UPDATE') {
            await this._handleConnectionUpdate(payload);
            return;
        }

        if (type !== 'MESSAGES_UPSERT') {
            logger.debug(`[WEBHOOK_SKIP] Event ${type} is not MESSAGES_UPSERT. Ignoring.`);
            return;
        }

        const data = payload.data;
        const message = data.message;
        
        // Extract remoteJid (conversationId)
        let remoteJid = data.key.remoteJid;
        const pushName = data.pushName;

        // 0. FILTER: No groups
        if (remoteJid && remoteJid.endsWith('@g.us')) {
            logger.debug(`[WEBHOOK_SKIP] Group message detected (${remoteJid}). Ignoring as per user request.`);
            return;
        }

        // 0.1 FILTER: No status updates
        if (remoteJid === 'status@broadcast') {
            return;
        }

        // Extract body
        let body = '';
        if (message) {
            if (message.conversation) {
                body = message.conversation;
            } else if (message.extendedTextMessage) {
                body = message.extendedTextMessage.text;
            }
        }

        let messagePreview = body ? (body.length > 50 ? body.substring(0, 50) + '...' : body) : '[No Content]';
        logger.info(`📥 [WEBHOOK_DATA] From: ${pushName} (${remoteJid}) | Body: "${messagePreview}"`);

        try {
            // 1. Encontrar el canal (Channel) para obtener tenantId y companyId
            logger.info(`🔍 [WEBHOOK_STEP_1] Searching channel for instance: ${instance}`);
            const [channels] = await db.execute(
                'SELECT id, tenant_id, company_id FROM channels WHERE instance_name = ? LIMIT 1',
                [instance]
            );

            if (channels.length === 0) {
                logger.warn(`⚠️ [WEBHOOK_ABORT] No channel configured in DB for instance: ${instance}. Check your Channels configuration in dashboard.`);
                return;
            }

            const channel = channels[0];
            const tenantId = channel.tenant_id;
            const companyId = channel.company_id;
            const channelId = channel.id;

            logger.info(`✅ [WEBHOOK_STEP_1_OK] Channel found: ID=${channelId} | Tenant=${tenantId} | Company=${companyId}`);

            // 2. Buscar o crear el contacto
            logger.info(`🔍 [WEBHOOK_STEP_2] Resolving contact: ${remoteJid}`);
            let contact = await this.getOrCreateContact(tenantId, companyId, remoteJid, pushName);
            logger.info(`✅ [WEBHOOK_STEP_2_OK] Contact: ${contact.name} (ID: ${contact.id})`);

            // 3. Obtener o crear conversation_id (UUID, 30 min gap)
            logger.info(`🔍 [WEBHOOK_STEP_3] Resolving conversation ID for contact ${contact.id}`);
            const conversationId = await conversationService.getOrCreateConversationId(tenantId, contact.id, channelId);
            logger.info(`✅ [WEBHOOK_STEP_3_OK] Conversation: ${conversationId.substring(0, 8)}...`);
            
            // 4. Guardar el mensaje CON conversation_id
            logger.info(`💾 [WEBHOOK_STEP_4] Saving message to DB...`);
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, channel_id, contact_id, direction, content, status, external_msg_id, conversation_id, created_at) 
                VALUES (?, ?, ?, 'INBOUND', ?, 'RECEIVED', ?, ?, NOW())`,
                [tenantId, channelId, contact.id, body, data.key.id || null, conversationId]
            );

            const messageId = result.insertId;
            logger.info(`✅ [WEBHOOK_STEP_4_OK] Message saved (ID: ${messageId})`);

            // 5. Obtener últimos 10 mensajes
            const [history] = await db.execute(
                `SELECT * FROM omni_channel_messages 
                WHERE tenant_id = ? AND contact_id = ? 
                ORDER BY created_at DESC LIMIT 10`,
                [tenantId, contact.id]
            );

            // 6. Emitir por Socket.IO (SIEMPRE, independiente del chatbot gate)
            const isGroupJid = remoteJid.endsWith('@g.us');
            const phoneDigits = isGroupJid ? remoteJid.split('@')[0] : remoteJid.split('@')[0].replace(/\D/g, '');
            const roomName = `tenant_${tenantId}_contact_${phoneDigits}`;
            logger.info(`📡 [WEBHOOK_STEP_6] Emitting to Socket.io room: ${roomName}`);
            
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
            logger.info(`✅ [WEBHOOK_STEP_6_OK] Socket event emitted.`);

            // 7. CHATBOT GATE: Check if chatbot is enabled for this contact
            logger.info(`🛡️ [WEBHOOK_STEP_7] Checking Chatbot Gate for Contact: ${contact.id}`);
            try {
                const chatbotEnabled = await chatbotGateService.isChatbotEnabled(tenantId, contact.id);

                if (chatbotEnabled) {
                    logger.info(`🤖 [WEBHOOK_GATE] Chatbot is ENABLED. Buffering for AI agent...`);
                    // Buffer the message (3s debounce → Kafka)
                    const buffered = await messageBufferService.bufferMessage(
                        tenantId, companyId, contact.id, conversationId,
                        { body, messageId, timestamp: new Date().toISOString() },
                        { instance, remoteJid }
                    );

                    if (buffered) {
                        logger.info(`📦 [WEBHOOK_STEP_7_OK] Message ${messageId} successfully buffered. AI response pending.`);
                    } else {
                        logger.warn(`⚠️ [WEBHOOK_STEP_7_FAIL] Buffer failed for message ${messageId}. Message will not reach AI agent.`);
                    }
                } else {
                    logger.info(`👤 [WEBHOOK_GATE] Chatbot is DISABLED. Human-only mode.`);
                }
            } catch (gateError) {
                logger.error(`❌ [WEBHOOK_GATE_ERROR] Chatbot gate/buffer failed: ${gateError.message}`);
            }

        } catch (error) {
            logger.error(`❌ [WEBHOOK_CRITICAL_ERROR] ${error.message}`);
            logger.error(error.stack);
        }
    }

    /**
     * Procesar webhook general de Facebook
     */
    async processFacebookWebhook(io, payload) {
        if (payload.object !== 'page') return;

        if (payload.entry) {
            for (const entry of payload.entry) {
                const pageId = entry.id;
                
                if (entry.messaging) {
                    for (const webhookEvent of entry.messaging) {
                        if (webhookEvent.message && !webhookEvent.message.is_echo) {
                            await this._handleFacebookMessage(io, pageId, webhookEvent);
                        }
                    }
                }
            }
        }
    }

    /**
     * Procesar un mensaje entrante de Facebook Messenger
     * FLOW: Save → Conversation ID → Socket.IO → Chatbot Gate → Buffer/Kafka
     */
    async _handleFacebookMessage(io, pageId, event) {
        const senderId = event.sender.id;
        const message = event.message;
        const body = message.text || '[Multimedia]';
        const messageIdStr = message.mid;

        let messagePreview = body ? (body.length > 50 ? body.substring(0, 50) + '...' : body) : '[No Content]';
        logger.info(`📥 [FB_WEBHOOK] From: ${senderId} to Page: ${pageId} | Body: "${messagePreview}"`);

        try {
            // 1. Encontrar el canal de FB usando el pageId
            const [channels] = await db.execute(
                `SELECT id, tenant_id, company_id FROM channels 
                 WHERE platform = 'FACEBOOK' AND JSON_EXTRACT(settings_json, '$.pageId') = ? LIMIT 1`,
                [pageId]
            );

            if (channels.length === 0) {
                logger.warn(`⚠️ [FB_WEBHOOK_ABORT] No channel configured for pageId: ${pageId}`);
                return;
            }

            const channel = channels[0];
            const tenantId = channel.tenant_id;
            const companyId = channel.company_id;
            const channelId = channel.id;

            // 2. Buscar o crear contacto usando el Sender ID (PSID)
            const contact = await this.getOrCreateContact(tenantId, companyId, senderId, 'Usuario Facebook');

            // 3. Obtener o crear conversation_id
            const conversationId = await conversationService.getOrCreateConversationId(tenantId, contact.id, channelId);

            // 4. Guardar mensaje
            const [result] = await db.execute(
                `INSERT INTO omni_channel_messages 
                (tenant_id, channel_id, contact_id, direction, content, status, external_msg_id, conversation_id, created_at) 
                VALUES (?, ?, ?, 'INBOUND', ?, 'RECEIVED', ?, ?, NOW())`,
                [tenantId, channelId, contact.id, body, messageIdStr, conversationId]
            );

            const internalMessageId = result.insertId;

            // 5. Historial reciente
            const [history] = await db.execute(
                `SELECT * FROM omni_channel_messages 
                WHERE tenant_id = ? AND contact_id = ? 
                ORDER BY created_at DESC LIMIT 10`,
                [tenantId, contact.id]
            );

            // 6. Emitir por Socket.IO (La sala usa contact.phone que internamente es el Sender ID)
            const roomName = `tenant_${tenantId}_contact_${contact.phone}`;
            
            const eventPayload = {
                message: {
                    id: internalMessageId,
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
            logger.info(`✅ [FB_WEBHOOK] Socket event emitted to: ${roomName}`);

            // 7. CHATBOT GATE
            try {
                const chatbotEnabled = await chatbotGateService.isChatbotEnabled(tenantId, contact.id);

                if (chatbotEnabled) {
                    logger.info(`🤖 [FB_WEBHOOK_GATE] Chatbot is ENABLED. Buffering for AI agent...`);
                    await messageBufferService.bufferMessage(
                        tenantId, companyId, contact.id, conversationId,
                        { body, messageId: internalMessageId, timestamp: new Date().toISOString() },
                        { instance: 'facebook', remoteJid: senderId }
                    );
                } else {
                    logger.info(`👤 [FB_WEBHOOK_GATE] Chatbot is DISABLED. Human-only mode.`);
                }
            } catch (gateError) {
                logger.error(`❌ [FB_WEBHOOK_GATE_ERROR] Chatbot gate/buffer failed: ${gateError.message}`);
            }

        } catch (error) {
            logger.error(`❌ [FB_WEBHOOK_CRITICAL_ERROR] ${error.message}`);
            logger.error(error.stack);
        }
    }

    /**
     * Lógica de obtener o crear contacto (con UUID y protección contra duplicados)
     */
    async getOrCreateContact(tenantId, companyId, jid, name) {
        // Handle LIDs (WhatsApp Business IDs like 5731367867091585388297@s.whatsapp.net)
        // If it's a LID, it doesn't have the phone format. We try to use it as is or clean it.
        const phone = jid.split('@')[0];
        
        // If it's a LID (very long or contains letters/weird patterns), we still use it as the unique identifier
        // but we might want to flag it or try to resolve it later.
        const isLid = phone.length > 15 || /[a-zA-Z]/.test(phone);
        const cleanPhone = isLid ? phone : phone.replace(/[^0-9]/g, '');

        if (isLid) {
            logger.info(`🆔 [WEBHOOK] LID detected: ${phone}. Using as unique identifier for contact.`);
        }

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

            // 2. No existe: buscar el pipeline por defecto del tenant y su primera etapa
            let defaultPipelineId = null;
            let defaultStageId = null;

            try {
                const [pipelines] = await db.execute(
                    'SELECT id FROM pipelines WHERE tenant_id = ? ORDER BY id ASC LIMIT 1',
                    [tenantId]
                );
                if (pipelines.length > 0) {
                    defaultPipelineId = pipelines[0].id;
                    const [stages] = await db.execute(
                        'SELECT id FROM pipeline_stages WHERE pipeline_id = ? ORDER BY position ASC LIMIT 1',
                        [defaultPipelineId]
                    );
                    if (stages.length > 0) defaultStageId = stages[0].id;
                }
                if (defaultPipelineId && defaultStageId) {
                    logger.info(`🏷️ [WEBHOOK] Default pipeline=${defaultPipelineId}, first stage=${defaultStageId} (tenant ${tenantId})`);
                } else {
                    logger.warn(`⚠️ [WEBHOOK] No pipeline/stage found for tenant ${tenantId}, contact created without stage`);
                }
            } catch (pipelineErr) {
                logger.warn(`⚠️ [WEBHOOK] Could not fetch default pipeline: ${pipelineErr.message}`);
            }

            // 3. Crear contacto nuevo con UUID + pipeline/stage asignados
            const contactName = name ? `${name} (${cleanPhone})` : `Nuevo Contacto ${cleanPhone}`;
            const contactUuid = require('crypto').randomUUID();

            try {
                const [result] = await db.execute(
                    `INSERT INTO contacts
                    (uuid, name, phone, type, stage, is_active, tenant_id, company_id,
                     pipeline_id, stage_id, created_at, updated_at)
                    VALUES (?, ?, ?, 'LEAD', 'LEAD', 1, ?, ?, ?, ?, NOW(), NOW())`,
                    [contactUuid, contactName, cleanPhone, tenantId, companyId,
                     defaultPipelineId, defaultStageId]
                );

                const contactId = result.insertId;

                // 4. Registrar en conversation_pipeline_state
                if (defaultPipelineId && defaultStageId) {
                    try {
                        await db.execute(
                            `INSERT INTO conversation_pipeline_state
                            (tenant_id, contact_id, pipeline_id, current_stage_id,
                             entered_stage_at, is_active, created_at, updated_at)
                            VALUES (?, ?, ?, ?, NOW(), 1, NOW(), NOW())`,
                            [tenantId, contactId, defaultPipelineId, defaultStageId]
                        );
                        logger.info(`📊 [WEBHOOK] Pipeline state created for contact ${contactId}`);
                    } catch (stateErr) {
                        logger.warn(`⚠️ [WEBHOOK] Could not create pipeline state: ${stateErr.message}`);
                    }
                }

                const [newContacts] = await db.execute('SELECT * FROM contacts WHERE id = ?', [contactId]);
                logger.info(`🆕 [WEBHOOK] New contact created: ${contactName} (ID: ${contactId}, stage_id: ${defaultStageId})`);
                return newContacts[0];

            } catch (insertError) {
                // 5. Si falla por duplicado (race condition), recuperar el existente
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
        
        let resPreview = respuesta ? (respuesta.length > 50 ? respuesta.substring(0, 50) + '...' : respuesta) : '[Empty]';
        logger.info(`🤖 [AI-RESPONSE] Processing response for contact ${contactId} in conv ${conversationId.substring(0, 8)}... Content: "${resPreview}"`);

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
                // Detectar si es un grupo (ID largo o contiene guión)
                const isGroup = contact.phone.includes('-') || contact.phone.length > 15;
                const remoteJid = isGroup ? `${contact.phone}@g.us` : `${contact.phone}@s.whatsapp.net`;
                
                // Interceptar MediaMessage format
                let mediaUrl = null;
                let textContent = respuesta;
                
                // Buscar [URL] o ![texto](URL) en cualquier parte del mensaje.
                const mediaRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)|\[(https?:\/\/[^\]]+)\]/;
                const match = respuesta.match(mediaRegex);
                
                if (match) {
                    // El grupo 1 es para formato markdown ![](), el grupo 2 para [URL]
                    mediaUrl = match[1] || match[2];
                    // Remover el bloque [URL] del texto final
                    textContent = respuesta.replace(mediaRegex, '').trim();
                    // Limpiar posibles líneas vacías dobles resultantes
                    textContent = textContent.replace(/\n\s*\n/g, '\n\n');
                }

                if (mediaUrl) {
                    await evolutionClient.sendMedia(channel.instance_name, remoteJid, mediaUrl, textContent);
                    logger.info(`✅ [AI-RESPONSE] MediaMessage sent to WhatsApp for contact ${contactId}`);
                } else {
                    await evolutionClient.sendMessage(channel.instance_name, remoteJid, respuesta);
                    logger.info(`✅ [AI-RESPONSE] TextMessage sent to WhatsApp for contact ${contactId}`);
                }
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
                contact: contact,
                tenantId: tenantId
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

    /**
     * Manejar actualizaciones de estado de conexión (Evolution API)
     */
    async _handleConnectionUpdate(payload) {
        const { instance, data } = payload;
        const state = data.state;
        const statusReason = data.statusReason;

        logger.info(`🔄 [CONN_UPDATE] Instance: ${instance} | State: ${state} | Reason: ${statusReason || 'N/A'}`);

        // Detectar estados de desconexión crítica
        // Código 428 suele ser "refused" (desvinculado)
        if (state === 'refused' || state === 'close' || statusReason === 428) {
            logger.warn(`⚠️ [CONN_LOST] Instance ${instance} is DISCONNECTED. Triggering admin notification...`);
            await this._notifyAdminDisconnection(instance);
        }
    }

    /**
     * Buscar administrador y enviar correo de alerta
     */
    async _notifyAdminDisconnection(instance) {
        try {
            // 1. Encontrar tenantId y companyId
            const [channels] = await db.execute(
                'SELECT tenant_id, company_id, name FROM channels WHERE instance_name = ? LIMIT 1',
                [instance]
            );

            if (channels.length === 0) return;
            const { tenant_id: tenantId, name: channelName } = channels[0];

            // 2. Encontrar Admin Email, Nombre y Nombre de Compañía
            // Priorizamos rol ADMIN, luego MANAGER
            const [admins] = await db.execute(`
                SELECT u.email, u.nombres, c.nombre_cliente 
                FROM users u 
                JOIN user_roles ur ON u.id = ur.user_id 
                JOIN roles r ON ur.role_id = r.id 
                JOIN clientes c ON u.customer_id = c.id
                WHERE u.customer_id = ? AND r.role_name IN ('ADMIN', 'MANAGER')
                ORDER BY CASE WHEN r.role_name = 'ADMIN' THEN 1 ELSE 2 END
                LIMIT 1
            `, [tenantId]);

            if (admins.length === 0) {
                logger.warn(`⚠️ [NOTIFY_FAIL] No admin found for tenant ${tenantId}. Cannot send disconnection email.`);
                return;
            }

            const admin = admins[0];

            // 3. Preparar mensaje para Kafka (email-notifications)
            const notification = {
                to: admin.email,
                subject: `⚠️ Alerta: WhatsApp Desconectado - ${admin.nombre_cliente}`,
                username: admin.nombres,
                type: 'whatsapp-disconnection',
                templateData: {
                    name: admin.nombres,
                    companyName: admin.nombre_cliente,
                    instanceName: channelName || instance
                }
            };

            // 4. Publicar en Kafka
            const sent = await kafkaProducer.publishToEmailTopic(notification);
            if (sent) {
                logger.info(`📧 [NOTIFY_OK] Disconnection email scheduled for ${admin.email}`);
            }

        } catch (error) {
            logger.error(`❌ [NOTIFY_ERROR] Failed during disconnection handling: ${error.message}`);
        }
    }
}

module.exports = new ChatService();
