const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
};

conn.on('ready', () => {
  const sql = "SELECT COUNT(*) FROM cloud_master.clientes;";
  const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker -N -e "${sql}"`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('close', () => {
      console.log('CLIENTS_COUNT:', data.trim());
      conn.end();
    }).on('data', d => data += d.toString()).stderr.on('data', e => console.error(e.toString()));
  });
}).connect(config);
