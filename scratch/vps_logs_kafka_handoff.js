const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000,
};

const cmds = [
  {
    title: '=== docker ps (kafka, chat, ai, notification) ===',
    cmd: "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'kafka|chat_socket|ai_agent|notification' || true",
  },
  {
    title: '=== chat_socket: KAFKA / DEBOUNCE / WEBHOOK (last matches) ===',
    cmd: "docker logs --tail 1200 chat_socket 2>&1 | grep -iE 'KAFKA|DEBOUNCE|WEBHOOK_STEP|BUFFER|CHATBOT-GATE|WEBHOOK_GATE|error|fail' | tail -n 100",
  },
  {
    title: '=== chat_socket: startup AI-INFRA / KAFKA ===',
    cmd: "docker logs chat_socket 2>&1 | grep -iE 'AI-INFRA|KAFKA' | head -n 40",
  },
  {
    title: '=== kafka container (last 50 lines) ===',
    cmd: 'docker logs --tail 50 kafka 2>&1',
  },
  {
    title: '=== ai_agent: KAFKA / HANDOFF (last matches) ===',
    cmd: "docker logs --tail 2000 ai_agent 2>&1 | grep -iE 'KAFKA|HANDOFF|AI_STEP|AI_HANDOFF|whatsapp|error' | tail -n 60",
  },
  {
    title: '=== notification-service: whatsapp (last matches) ===',
    cmd: "docker logs --tail 800 notification-service 2>&1 | grep -iE 'whatsapp|Kafka|Received|instance|error' | tail -n 40",
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
    console.log('Connected to VPS\n');
    for (const { title, cmd } of cmds) {
      console.log(title);
      try {
        const out = await run(conn, cmd);
        console.log(out || '(sin salida)\n');
      } catch (e) {
        console.log(`ERROR: ${e.message}\n`);
      }
    }
    conn.end();
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect(config);
