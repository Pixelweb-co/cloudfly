const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 120000,
};

function exec(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${label}\n$ ${cmd}\n`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => {
        process.stderr.write(d);
        out += d;
      });
      stream.on('close', (code) => resolve({ code, out }));
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const conn = new Client();
conn
  .on('ready', async () => {
    console.log('✅ Connected to VPS\n');
    const compose = 'cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml';

    await exec(conn, `${compose} restart kafka`, 'Restart kafka');
    console.log('\n⏳ Waiting 20s for Kafka...');
    await sleep(20000);

    await exec(conn, `${compose} restart chat-socket-service ai-agent`, 'Restart chat-socket-service + ai-agent');
    console.log('\n⏳ Waiting 25s for services to init...');
    await sleep(25000);

    await exec(
      conn,
      "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'kafka|chat_socket|ai_agent' || true",
      'Container status'
    );

    await exec(
      conn,
      "docker logs chat_socket 2>&1 | grep -iE 'KAFKA.*Producer connected|AI-INFRA.*All systems|KAFKA.*Failed|ECONNREFUSED' | tail -n 15",
      'chat_socket Kafka startup lines'
    );

    await exec(
      conn,
      "docker logs --tail 30 ai_agent 2>&1 | grep -iE 'Kafka consumer started|ERROR|started' || docker logs --tail 10 ai_agent 2>&1",
      'ai_agent recent startup'
    );

    conn.end();
    console.log('\n✅ Done. Run: node scratch/vps_logs_kafka_handoff.js to verify after sending a test message.');
  })
  .on('error', (e) => {
    console.error('❌ SSH error:', e.message);
    process.exit(1);
  })
  .connect(config);
