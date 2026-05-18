const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  console.log('🚀 SSH Client Connected. Describing plans table...');
  const remoteCmd = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e "DESC plans;"`;
  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', (d) => process.stdout.write(d.toString()))
      .stderr.on('data', (e) => process.stderr.write(e.toString()));
  });
}).connect(config);
