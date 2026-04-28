const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sqlCommand = 'docker logs --since 15m scheduler-service | tail -n 100';
  
  conn.exec(sqlCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 20000
});
