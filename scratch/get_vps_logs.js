const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const commands = [
    'cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml logs --tail 2000 ai-agent | grep -A 20 "create_order"'
  ];

  const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let stdout = '';
        let stderr = '';
        stream.on('close', (code, signal) => {
          resolve({ cmd, code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data;
        }).stderr.on('data', (data) => {
          stderr += data;
        });
      });
    });
  };

  (async () => {
    for (const cmd of commands) {
      console.log(`\n--- RUNNING: ${cmd} ---`);
      const res = await runCommand(cmd);
      console.log(`STDOUT:\n${res.stdout}`);
      if (res.stderr) console.log(`STDERR:\n${res.stderr}`);
      console.log(`EXIT CODE: ${res.code}`);
    }
    conn.end();
  })();
}).connect({
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 20000
});
