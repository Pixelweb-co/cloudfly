const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(
    'docker logs --tail 500 ai_agent 2>&1 | grep -iE "contact_id.: 56|contact_id.:56|HANDOFF|asesor|Comunicame|whatsapp|AI_HANDOFF"',
    (err, stream) => {
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.stderr.on('data', (d) => { out += d; });
      stream.on('close', () => {
        console.log(out || '(sin coincidencias)');
        conn.end();
      });
    }
  );
}).connect({
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000,
});
