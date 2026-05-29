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
    title: '=== ai_agent around campaign send (19:08) + SKIP ===',
    cmd: "docker logs --since '2026-05-28T19:07:00' --until '2026-05-28T19:10:00' ai_agent 2>&1 | grep -iE 'KAFKA|AI_START|CAMPAIGN|SKIP|contact_id.: 120|contact_id.:120'",
  },
  {
    title: '=== chat_socket fromMe / campaign window ===',
    cmd: "docker logs --since '2026-05-28T19:07:00' --until '2026-05-28T19:10:30' chat_socket 2>&1 | grep -iE 'WEBHOOK|fromMe|573245640657|BUFFER|KAFKA|contact 120'",
  },
  {
    title: '=== campaign 1 message from DB ===',
    cmd: "docker exec mysql mysql -uroot -p$MYSQL_ROOT_PASSWORD cloudfly -N -e \"SELECT id, LEFT(message,200) FROM campaigns WHERE id=1; SELECT contact_id, LEFT(destination,20), status, sent_at FROM campaign_send_logs WHERE campaign_id=1 ORDER BY sent_at DESC LIMIT 3;\" 2>/dev/null || docker exec mysql mysql -uroot -pcloudfly123 cloudfly -N -e \"SELECT id, LEFT(message,200) FROM campaigns WHERE id=1;\" 2>/dev/null || echo 'mysql cmd failed'",
  },
  {
    title: '=== all AI_CAMPAIGN_SKIP ever in ai_agent ===',
    cmd: "docker logs --tail 5000 ai_agent 2>&1 | grep -i 'AI_CAMPAIGN_SKIP' || echo '(ninguno)'",
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
    console.log('Connected\n');
    for (const { title, cmd } of cmds) {
      console.log(title);
      try {
        console.log((await run(conn, cmd)) || '(sin salida)\n');
      } catch (e) {
        console.log(`ERROR: ${e.message}\n`);
      }
    }
    conn.end();
  })
  .on('error', (e) => {
    console.error(e.message);
    process.exit(1);
  })
  .connect(config);
