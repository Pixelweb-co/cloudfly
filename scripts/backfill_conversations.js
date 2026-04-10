/**
 * Backfill script for assigning conversation_id to existing messages.
 * Logic: Group by contact, sort by time. If gap > 30 mins, new UUID.
 * Usage: node scripts/backfill_conversations.js
 */
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: 'chat-socket-service/.env' });

const CONVERSATION_GAP_MINUTES = 30;

async function backfill() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'widowmaker',
        database: process.env.DB_NAME || 'cloud_master'
    });

    console.log('🚀 Starting backfill process...');

    try {
        // 1. Get all unique contact + tenant pairs that have messages
        const [contacts] = await connection.execute(
            'SELECT DISTINCT tenant_id, contact_id FROM omni_channel_messages WHERE conversation_id IS NULL'
        );

        console.log(`📊 Found ${contacts.length} unique contacts with missing conversation_ids.`);

        for (const { tenant_id, contact_id } of contacts) {
            console.log(`🔄 Processing contact ${contact_id} for tenant ${tenant_id}...`);

            // 2. Get all messages for this contact ordered by time
            const [messages] = await connection.execute(
                `SELECT id, created_at FROM omni_channel_messages 
                 WHERE tenant_id = ? AND contact_id = ? AND conversation_id IS NULL
                 ORDER BY created_at ASC`,
                [tenant_id, contact_id]
            );

            if (messages.length === 0) continue;

            let currentConvId = uuidv4();
            let lastTime = new Date(messages[0].created_at);
            
            // First message in the batch gets the first ID
            await connection.execute(
                'UPDATE omni_channel_messages SET conversation_id = ? WHERE id = ?',
                [currentConvId, messages[0].id]
            );

            for (let i = 1; i < messages.length; i++) {
                const msg = messages[i];
                const currentTime = new Date(msg.created_at);
                const diffMinutes = (currentTime - lastTime) / (1000 * 60);

                if (diffMinutes > CONVERSATION_GAP_MINUTES) {
                    currentConvId = uuidv4();
                    console.log(`   ✨ New conversation started for message ${msg.id} (gap: ${diffMinutes.toFixed(1)} min)`);
                }

                await connection.execute(
                    'UPDATE omni_channel_messages SET conversation_id = ? WHERE id = ?',
                    [currentConvId, msg.id]
                );

                lastTime = currentTime;
            }
        }

        console.log('✅ Backfill completed successfully.');

    } catch (error) {
        console.error('❌ Error during backfill:', error);
    } finally {
        await connection.end();
    }
}

backfill();
