const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const sqlCommand = 'docker exec mysql mysql -u root -pwidowmaker -e "SELECT j.id, e.title, j.status, j.execute_at FROM cloud_master.scheduled_jobs j JOIN cloud_master.calendar_events e ON j.event_id = e.id WHERE j.status = \'DONE\' AND j.execute_at >= \'2026-04-28 00:00:00\' ORDER BY j.execute_at DESC LIMIT 10;"';
  
  conn.exec(sqlCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
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
