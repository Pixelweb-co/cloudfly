const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sqlCommand = 'docker exec mysql mysql -u root -pwidowmaker -e "SELECT * FROM cloud_master.scheduled_jobs WHERE event_id = 48;"';
  
  conn.exec(sqlCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT:\n' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR:\n' + data);
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
