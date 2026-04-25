
const axios = require('axios');

const WEBHOOK_URL = 'http://109.205.182.94:3001/webhook/evolution';

const testCases = [
    {
        name: 'Normal Message (Maria)',
        payload: {
            event: 'messages.upsert',
            instance: 'cloudfly_t1_c1',
            data: {
                key: {
                    remoteJid: '573115602559@s.whatsapp.net',
                    id: 'TEST_NORMAL_' + Date.now()
                },
                pushName: 'Maria Test',
                message: {
                    conversation: 'Hola, quiero comprar algo'
                }
            }
        }
    },
    {
        name: 'Group Message (Should be ignored)',
        payload: {
            event: 'messages.upsert',
            instance: 'cloudfly_t1_c1',
            data: {
                key: {
                    remoteJid: '123456789@g.us',
                    id: 'TEST_GROUP_' + Date.now()
                },
                pushName: 'Group Test',
                message: {
                    conversation: 'Mensaje en grupo'
                }
            }
        }
    },
    {
        name: 'LID Message (WhatsApp Business)',
        payload: {
            event: 'messages.upsert',
            instance: 'cloudfly_t1_c1',
            data: {
                key: {
                    remoteJid: '5731367867091585388297@s.whatsapp.net',
                    id: 'TEST_LID_' + Date.now()
                },
                pushName: 'Business Account',
                message: {
                    conversation: 'Consulta de negocio con LID'
                }
            }
        }
    },
    {
        name: 'Status Update (Should be ignored)',
        payload: {
            event: 'messages.upsert',
            instance: 'cloudfly_t1_c1',
            data: {
                key: {
                    remoteJid: 'status@broadcast',
                    id: 'TEST_STATUS_' + Date.now()
                },
                pushName: 'Status',
                message: {
                    conversation: 'Status update'
                }
            }
        }
    }
];

async function runTests() {
    console.log('🚀 Starting Webhook Filter Tests...');
    
    for (const test of testCases) {
        console.log(`\n----------------------------------------`);
        console.log(`🧪 Testing: ${test.name}`);
        try {
            const response = await axios.post(WEBHOOK_URL, test.payload);
            console.log(`✅ Success: ${response.status}`);
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
            if (error.response) {
                console.error(`Response: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
    
    console.log('\n🏁 Tests finished. Check server logs for results.');
}

runTests();
