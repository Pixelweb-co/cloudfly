const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const logger = require('../utils/logger');

const CONVERSATION_GAP_MINUTES = 30;

class ConversationService {
    /**
     * Get or create a conversation_id (UUID) for a contact.
     * If the last message was < 30 minutes ago → reuse its conversation_id.
     * Otherwise → generate a new UUID.
     */
    async getOrCreateConversationId(tenantId, contactId, channelId) {
        try {
            // Find the last message with a conversation_id for this contact
            const [rows] = await db.execute(
                `SELECT conversation_id, created_at 
                 FROM omni_channel_messages 
                 WHERE tenant_id = ? AND contact_id = ? AND conversation_id IS NOT NULL
                 ORDER BY created_at DESC LIMIT 1`,
                [tenantId, contactId]
            );

            if (rows.length > 0) {
                const lastMsg = rows[0];
                const lastTime = new Date(lastMsg.created_at);
                const now = new Date();
                const diffMinutes = (now - lastTime) / (1000 * 60);

                if (diffMinutes < CONVERSATION_GAP_MINUTES) {
                    logger.info(`🔄 [CONVERSATION] Reusing conversation ${lastMsg.conversation_id} for contact ${contactId} (gap: ${diffMinutes.toFixed(1)} min)`);
                    return lastMsg.conversation_id;
                }
            }

            // Create new conversation
            const newConversationId = uuidv4();
            logger.info(`🆕 [CONVERSATION] New conversation ${newConversationId} for contact ${contactId}`);
            return newConversationId;

        } catch (error) {
            logger.error(`❌ [CONVERSATION] Error: ${error.message}`);
            // Fallback: always return a new UUID so the flow doesn't break
            return uuidv4();
        }
    }
}

module.exports = new ConversationService();
