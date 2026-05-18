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
  console.log('🚀 SSH Client Connected. Querying plan_modules and modules...');
  
  const sql = `
    USE cloud_master;
    SELECT * FROM plans_modules;
    SELECT * FROM modules;
    SELECT * FROM subscription_modules WHERE subscription_id = (SELECT id FROM subscriptions WHERE customer_id = 77 LIMIT 1);
    SELECT * FROM subscriptions WHERE customer_id = 77;
  `.replace(/\n/g, ' ').trim();
  
  const remoteCmd = `docker exec -i mysql mysql -uroot -pwidowmaker -e "${sql}"`;
  
  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      conn.end();
    }).on('data', (d) => {
      process.stdout.write(d.toString());
    }).stderr.on('data', (e) => {
      process.stderr.write(e.toString());
    });
  });
}).connect(config);
