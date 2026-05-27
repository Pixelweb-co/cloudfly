const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

async function test(user, pass) {
    const client = new ImapFlow({
        host: '89.117.147.134',
        port: 993,
        secure: true,
        auth: {
            user: `${user}@cloudfly.com.co`,
            pass: pass
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: true
    });

    try {
        await client.connect();
        console.log("CONECTADO a", user);
        let lock = await client.getMailboxLock('INBOX');
        try {
            let mailbox = await client.status('INBOX', { messages: true });
            console.log("MENSAJES:", mailbox.messages);
            if (mailbox.messages > 0) {
                // Fetch using explicit range
                for await (let msg of client.fetch(`${mailbox.messages}:${mailbox.messages}`, { source: true })) {
                    let parsed = await simpleParser(msg.source);
                    console.log("SUBJECT:", parsed.subject);
                    console.log("BODY PREVIEW:", (parsed.text || parsed.html || "").substring(0, 100));
                }
            }
        } finally {
            lock.release();
        }
        await client.logout();
    } catch (e) {
        console.error("ERROR:", e);
    }
}

test('debug_user', 'Cloudfly2025');
