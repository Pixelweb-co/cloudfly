const { execSync } = require('child_process');
const { ImapFlow } = require('imapflow');

class MailHelper {
    constructor() {
        this.host = '89.117.147.134';
        this.sshPort = 10622;
        this.sshKey = 'C:/Users/Edwin/.ssh/id_rsa_cloudfly';
        this.domain = 'cloudfly.com.co';
    }

    runSsh(command) {
        const fullCmd = `ssh -o StrictHostKeyChecking=no -o BatchMode=yes -p ${this.sshPort} -i "${this.sshKey}" root@${this.host} "${command}"`;
        try {
            return execSync(fullCmd).toString().trim();
        } catch (e) {
            console.error(`❌ SSH Error: ${e.message}`);
            return null;
        }
    }

    async createAccount(account, password) {
        console.log(`📩 Creando buzón: ${account}@${this.domain}`);
        const cmd = `/usr/local/hestia/bin/v-add-mail-account cloudfly ${this.domain} ${account} '${password}'`;
        const res = this.runSsh(cmd);
        if (res !== null) {
            console.log('⏳ Esperando propagación del buzón (8s para asegurar IMAP)...');
            await new Promise(r => setTimeout(r, 8000));
            return true;
        }
        return false;
    }

    async deleteAccount(account) {
        console.log(`🗑️ Eliminando buzón: ${account}@${this.domain}`);
        const cmd = `/usr/local/hestia/bin/v-delete-mail-account cloudfly ${this.domain} ${account}`;
        this.runSsh(cmd);
    }

    async getActivationLink(account, password, timeoutMs = 150000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const client = new ImapFlow({
                host: this.host,
                port: 993,
                secure: true,
                auth: {
                    user: `${account}@${this.domain}`,
                    pass: password
                },
                logger: false,
                tls: {
                    rejectUnauthorized: false
                }
            });

            try {
                await client.connect();
                console.log('   (IMAP Conectado)');
                const mailbox = await client.mailboxOpen('INBOX');
                
                if (mailbox.exists > 0) {
                    // Buscar todos los mensajes
                    let lastMsg = null;
                    for await (let msg of client.fetch('1:*', { source: true })) {
                        lastMsg = msg;
                    }
                    
                    if (lastMsg) {
                    const source = lastMsg.source.toString();
                    
                    // Decodificación simple de Quoted-Printable
                    const decoded = source.replace(/=\r?\n/g, '').replace(/=3D/g, '=');
                    
                    const match = decoded.match(/https?:\/\/[^\s<>"]+\/verificate\/[a-zA-Z0-9\-]+/);
                    if (match) {
                        console.log(`✅ Link encontrado: ${match[0]}`);
                        await client.logout();
                        return match[0];
                    } else {
                        console.log('   (Mensaje encontrado pero sin link de activación aún)');
                    }
                }
            }
            await client.logout();
            } catch (e) {
                console.error(`   (Error IMAP: ${e.message})`);
                try { await client.logout(); } catch(err){}
            }
            await new Promise(r => setTimeout(r, 10000));
        }

        console.error('❌ Timeout esperando el email.');
        return null;
    }
}

module.exports = new MailHelper();
