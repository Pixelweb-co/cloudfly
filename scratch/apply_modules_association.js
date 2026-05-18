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
  console.log('🚀 SSH Client Connected. Associating modules in database...');
  
  const sql = `
    USE cloud_master;
    
    -- 1. Clean up old incorrect plan associations
    DELETE FROM plans_modules WHERE plan_id IN (1, 2);
    
    -- 2. Associate active modules (1, 4, 5, 6, 8, 9, 10, 14, 15) to Free Plan (plan_id = 1)
    INSERT INTO plans_modules (plan_id, module_id) VALUES 
    (1, 1), (1, 4), (1, 5), (1, 6), (1, 8), (1, 9), (1, 10), (1, 14), (1, 15);
    
    -- 3. Associate active modules to Plan básico (plan_id = 2)
    INSERT INTO plans_modules (plan_id, module_id) VALUES 
    (2, 1), (2, 4), (2, 5), (2, 6), (2, 8), (2, 9), (2, 10), (2, 14), (2, 15);
    
    -- 4. Clean up old subscription modules for subscription 144
    DELETE FROM subscription_modules WHERE subscription_id = 144;
    
    -- 5. Associate all modules to subscription 144
    INSERT INTO subscription_modules (subscription_id, module_id) VALUES 
    (144, 1), (144, 4), (144, 5), (144, 6), (144, 8), (144, 9), (144, 10), (144, 14), (144, 15);
    
    -- Verify result
    SELECT * FROM plans_modules;
    SELECT * FROM subscription_modules WHERE subscription_id = 144;
  `.replace(/\n/g, ' ').trim();
  
  const remoteCmd = `docker exec -i mysql mysql -uroot -pwidowmaker -e "${sql}"`;
  
  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`✅ Module associations updated successfully with code ${code}`);
      conn.end();
    }).on('data', (d) => {
      process.stdout.write(d.toString());
    }).stderr.on('data', (e) => {
      process.stderr.write(e.toString());
    });
  });
}).connect(config);
