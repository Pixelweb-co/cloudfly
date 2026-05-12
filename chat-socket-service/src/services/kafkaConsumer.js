const { Kafka, logLevel } = require('kafkajs');
const logger = require('../utils/logger');
const chatService = require('./chatService');

let consumer = null;

async function initKafkaConsumer(io) {
    try {
        const brokers = (process.env.KAFKA_BROKER || 'kafka:9092').split(',');

        const kafka = new Kafka({
            clientId: 'chat-socket-consumer',
            brokers,
            logLevel: logLevel.WARN
        });

        consumer = kafka.consumer({ 
            groupId: 'chat-socket-responses',
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            rebalanceTimeout: 60000,
            allowAutoTopicCreation: true
        });
        
        await consumer.connect();
        logger.info('✅ [KAFKA-CONSUMER] Connected to Kafka brokers');

        await consumer.subscribe({ topics: ['messages.out', 'webnotifications'], fromBeginning: false });
        logger.info('✅ [KAFKA-CONSUMER] Subscribed to topics: messages.out, webnotifications');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    let payload = JSON.parse(message.value.toString());
                    
                    // Handle double-encoded JSON if necessary
                    if (typeof payload === 'string') {
                        try {
                            payload = JSON.parse(payload);
                        } catch (e) {
                            // Not a JSON string, keep as is
                        }
                    }
                    
                    if (topic === 'messages.out') {
                        logger.info(`📥 [KAFKA-CONSUMER] Received AI response payload: ${JSON.stringify(payload)}`);
                        const eventPayload = await chatService.processAiResponse(payload);
                        
                        if (eventPayload && io) {
                            const { tenantId, contact } = eventPayload;
                            const roomName = `tenant_${tenantId}_contact_${contact.phone}`;
                            io.to(roomName).emit('new-message', eventPayload);
                            logger.info(`📡 [KAFKA-CONSUMER] Emitted AI message to socket room: ${roomName}`);
                        }
                    } else if (topic === 'webnotifications') {
                        logger.info(`📥 [KAFKA-CONSUMER] Received web notification payload: ${JSON.stringify(payload)}`);
                        
                        if (io) {
                            const { tenantId, companyId, userId, title, description, type } = payload;
                            
                            // Emit to specific company room if available, else to all tenant users
                            let roomName = `tenant_${tenantId}`;
                            if (companyId) {
                                roomName = `tenant_${tenantId}_company_${companyId}`;
                            }
                            
                            // 1. Send the actual notification for the toast/popup
                            io.to(roomName).emit('new-web-notification', {
                                title,
                                description,
                                type,
                                timestamp: new Date().toISOString()
                            });
                            
                            // 2. Trigger dashboard refresh if it's an important update
                            if (type === 'order' || type === 'contact' || type === 'appointment') {
                                io.to(roomName).emit('dashboard-update', { type });
                                logger.info(`📡 [KAFKA-CONSUMER] Emitted dashboard-update to room: ${roomName}`);
                            }
                            
                            logger.info(`📡 [KAFKA-CONSUMER] Emitted new-web-notification to room: ${roomName}`);
                        }
                    }
                } catch (err) {
                    logger.error(`❌ [KAFKA-CONSUMER] Error processing message from topic ${topic}: ${err.message}`);
                }
            },
        });

    } catch (error) {
        logger.error(`❌ [KAFKA-CONSUMER] Failed to init consumer: ${error.message}`);
    }
}

async function disconnectKafkaConsumer() {
    if (consumer) {
        await consumer.disconnect();
        logger.info('🔌 [KAFKA-CONSUMER] Disconnected gracefully');
    }
}

module.exports = { initKafkaConsumer, disconnectKafkaConsumer };
