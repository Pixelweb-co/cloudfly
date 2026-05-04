const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    console.log('✅ SSH Client Ready');
    const sql = 'ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id BIGINT;';
    const cmd = `docker exec -i mysql mysql -u root -pwidowmaker cloud_master -e "${sql}"`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log(`\n✅ Command finished with code ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect({
    host: '109.205.182.94',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
    readyTimeout: 60000
});
