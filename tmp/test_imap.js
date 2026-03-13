const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

async function test() {
    const client = new ImapFlow({
        host: '89.117.147.134',
        port: 993,
        secure: true,
        auth: {
            user: 'gestorweb@cloudfly.com.co',
            pass: 'Elian2025#'
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: true
    });

    try {
        await client.connect();
        console.log("CONECTADO");
        let lock = await client.getMailboxLock('INBOX');
        try {
            let mailbox = await client.status('INBOX', { messages: true });
            console.log("MENSAJES:", mailbox.messages);
        } finally {
            lock.release();
        }
        await client.logout();
    } catch (e) {
        console.error("ERROR:", e);
    }
}

test();
