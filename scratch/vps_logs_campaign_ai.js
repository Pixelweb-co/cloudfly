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
    title: '=== docker ps (ai, chat, marketing, kafka) ===',
    cmd: "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -iE 'ai_agent|chat_socket|marketing|kafka|notification' || true",
  },
  {
    title: '=== ai_agent: CAMPAIGN / KAFKA / HANDOFF (last 80) ===',
    cmd: "docker logs --tail 3000 ai_agent 2>&1 | grep -iE 'AI_CAMPAIGN|CAMPAIGN|KAFKA_RECEIVED|AI_START|AI_STEP|AI_FINISHED|HANDOFF|error|Error' | tail -n 80",
  },
  {
    title: '=== ai_agent: last 40 lines (raw) ===',
    cmd: 'docker logs --tail 40 ai_agent 2>&1',
  },
  {
    title: '=== chat_socket: WEBHOOK / KAFKA / BUFFER (last 50) ===',
    cmd: "docker logs --tail 1500 chat_socket 2>&1 | grep -iE 'WEBHOOK|KAFKA|DEBOUNCE|BUFFER|CHATBOT-GATE' | tail -n 50",
  },
  {
    title: '=== marketing-worker: campaign (last 40) ===',
    cmd: "docker logs --tail 800 marketing-worker 2>&1 | grep -iE 'campaign|Campaign|Starting|completed|error' | tail -n 40",
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
