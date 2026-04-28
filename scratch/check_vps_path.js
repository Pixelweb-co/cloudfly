const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const checkFiles = 'ls -l /apps/cloudfly/notifications/src/main/java/com/notification/service/services/EmailService.java /apps/cloudfly/notifications/src/main/java/com/notification/service/services/KafkaConsumerListener.java /apps/cloudfly/notifications/src/main/java/com/notification/service/dto/NotificationMessage.java';
  
  conn.exec(checkFiles, (err, stream) => {
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
