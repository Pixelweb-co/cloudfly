const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(
    "docker logs --tail 400 chat_socket 2>&1 | grep -iE '573115602559|contact 56|asesor|Comunicame|HANDOFF|isBotHandoff|BUFFER|Published|AI-RESPONSE|CHATBOT'",
    (err, stream) => {
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.stderr.on('data', (d) => { out += d; });
      stream.on('close', () => {
        console.log(out || '(sin coincidencias en últimas 400 líneas)');
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
