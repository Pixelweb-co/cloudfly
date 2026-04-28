const { Client } = require('ssh2');
const fs = require('fs');

const filesToUpload = [
  {
    local: 'c:\\apps\\cloudfly\\notifications\\src\\main\\java\\com\\notification\\service\\services\\EmailService.java',
    remote: '/apps/cloudfly/notifications/src/main/java/com/notification/service/services/EmailService.java'
  },
  {
    local: 'c:\\apps\\cloudfly\\notifications\\src\\main\\java\\com\\notification\\service\\services\\KafkaConsumerListener.java',
    remote: '/apps/cloudfly/notifications/src/main/java/com/notification/service/services/KafkaConsumerListener.java'
  },
  {
    local: 'c:\\apps\\cloudfly\\notifications\\src\\main\\java\\com\\notification\\service\\dto\\NotificationMessage.java',
    remote: '/apps/cloudfly/notifications/src/main/java/com/notification/service/dto/NotificationMessage.java'
  }
];

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  
  let filesProcessed = 0;
  
  filesToUpload.forEach(file => {
    const content = fs.readFileSync(file.local, 'utf8');
    const uploadCommand = `cat << 'EOF' > ${file.remote}\n${content}\nEOF`;
    
    conn.exec(uploadCommand, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code) => {
        console.log(`Uploaded ${file.remote}. Code: ${code}`);
        filesProcessed++;
        
        if (filesProcessed === filesToUpload.length) {
          console.log('All files uploaded. Rebuilding notification-service...');
          const rebuildCommand = 'cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml up -d --build notification-service';
          conn.exec(rebuildCommand, (err, rebuildStream) => {
            if (err) throw err;
            rebuildStream.on('close', (rebuildCode) => {
              console.log('Rebuild completed. Code: ' + rebuildCode);
              conn.end();
            }).on('data', (data) => {
              process.stdout.write(data);
            }).stderr.on('data', (data) => {
              process.stderr.write(data);
            });
          });
        }
      }).stderr.on('data', (data) => {
        console.log('STDERR: ' + data);
      });
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
