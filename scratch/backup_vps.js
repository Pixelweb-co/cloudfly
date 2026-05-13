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
  console.log('SSH Ready');
  // Get all tables
  conn.exec('docker exec mysql mysql -uroot -pwidowmaker cloud_master -N -e "SHOW TABLES"', (err, stream) => {
    if (err) throw err;
    let tables = '';
    stream.on('data', (data) => { tables += data.toString(); });
    stream.on('close', () => {
      const tableList = tables.trim().split(/\s+/);
      console.log(`Found ${tableList.length} tables`);
      
      const backupFile = '/apps/cloudfly/db/backup_cloud_master.sql';
      conn.exec(`echo "-- CloudFly Backup" > ${backupFile}`, (err, stream) => {
        if (err) throw err;
        stream.on('close', async () => {
          for (const table of tableList) {
            console.log(`Dumping table: ${table}`);
            await new Promise((resolve) => {
              conn.exec(`docker exec mysql mysqldump -uroot -pwidowmaker --single-transaction --skip-lock-tables cloud_master ${table} >> ${backupFile}`, (err, stream) => {
                if (err) throw err;
                stream.on('close', () => resolve());
                stream.stderr.on('data', (d) => {
                   if (!d.toString().includes('Warning')) console.error(`Error on ${table}: ${d}`);
                });
              });
            });
          }
          console.log('✅ Backup finished');
          conn.end();
        });
      });
    });
  });
}).connect(config);
