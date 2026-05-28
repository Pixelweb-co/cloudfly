const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000,
};

const CONTACT_ID = process.env.CONTACT_ID || '56';
const PHONE_HINT = process.env.PHONE_HINT || '573115602559';

const cmds = [
  {
    title: `=== chat_socket: Camila / contact ${CONTACT_ID} ===`,
    cmd: `docker logs --tail 8000 chat_socket 2>&1 | grep -iE '573115602559|contact ${CONTACT_ID}|Camila|asesor|Comunicame|isBotHandoff.:true|HANDOFF|BUFFER FLUSHED|Published to messages' | tail -n 60`,
  },
  {
    title: `=== ai_agent: contact ${CONTACT_ID} handoff ===`,
    cmd: `docker logs --tail 8000 ai_agent 2>&1 | grep -iE '"contact_id": ${CONTACT_ID}|"contact_id":${CONTACT_ID}|HANDOFF|asesor|Comunicame|WhatsApp notification|AI_HANDOFF_NOTIFY' | tail -n 40`,
  },
  {
    title: '=== notification-service: whatsapp-notifications recent ===',
    cmd: "docker logs --tail 2000 notification-service 2>&1 | grep -iE 'whatsapp|Received email message|Sending WhatsApp|instance|contact|56' | tail -n 40",
  },
];

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.stderr.on('data', (d) => { out += d; });
      stream.on('close', () => resolve(out));
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    console.log(`Connected — tracing contact ${CONTACT_ID}\n`);
    for (const { title, cmd } of cmds) {
      console.log(title);
      console.log(await run(conn, cmd) || '(sin salida)\n');
    }
    conn.end();
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect(config);
