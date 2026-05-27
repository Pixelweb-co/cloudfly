const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 30000
};

const migrationDir = 'C:/apps/cloudfly/backend_new/src/main/resources/db/migration';
const baseFiles = [
  'C:/apps/cloudfly/restore_vps_db.sql',
  'C:/apps/cloudfly/bootstrap_cloudfly.sql'
];

conn.on('ready', async () => {
  console.log('✅ Connected to VPS via SSH key. Starting database recovery with error tolerance...');
  
  try {
    // 1. Run base restore scripts (Base tables)
    for (const baseFile of baseFiles) {
      const fileName = path.basename(baseFile);
      console.log(`\n📄 [BASE] Processing: ${fileName}`);
      const content = fs.readFileSync(baseFile, 'utf8');
      await executeSqlOnVps(content, fileName, false); // Fail on base script error
    }

    // 2. Read and sort migration files in order (V1 to V13)
    const files = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => {
        const getVer = f => parseInt(f.match(/^V(\d+)/)[1], 10);
        return getVer(a) - getVer(b);
      });

    console.log(`\n📂 Found ${files.length} migration files in order to execute...`);

    for (const file of files) {
      console.log(`\n🚀 [MIGRATION] Executing: ${file}`);
      const filePath = path.join(migrationDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      await executeSqlOnVps(content, file, true); // Tolerant of column/table warnings
    }

    // 3. Fix the manager password to 'Password123!'
    console.log('\n🔒 [SECURITY] Resetting manager password to "Password123!"...');
    const fixPwdSql = "USE cloud_master; UPDATE users SET password = '$2a$10$wttLfqsPnsvW0uF.GAODUuguENHoQX3RiPbqkNR7aWXYLAiHp9LEi' WHERE username = 'manager';";
    await executeSqlOnVps(fixPwdSql, 'fix_manager_password.sql', false);

    console.log('\n🎉 ALL DATABASE RESTORES AND MIGRATIONS COMPLETED!');
    
    // Quick test: SHOW TABLES
    console.log('\n📊 Listing all tables in cloud_master:');
    await executeSqlOnVps('USE cloud_master; SHOW TABLES;', 'show_tables.sql', false);
    
    conn.end();
  } catch (err) {
    console.error('\n💥 Critical failure during restore/migration process:', err);
    conn.end();
  }
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);

function executeSqlOnVps(sqlContent, fileName, tolerant = true) {
  return new Promise((resolve, reject) => {
    const tmpPath = `/tmp/${fileName}`;
    
    // Write SQL file to VPS tmp
    conn.exec(`cat > ${tmpPath} << 'EOF'\n${sqlContent}\nEOF\n`, (err, stream) => {
      if (err) return reject(err);
      
      stream.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Failed to write SQL file to ${tmpPath}`));
        
        // Execute inside mysql container
        const cmd = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master < ${tmpPath}`;
        conn.exec(cmd, (err2, execStream) => {
          if (err2) return reject(err2);
          
          let stderr = '';
          execStream.on('close', (exitCode) => {
            if (exitCode === 0) {
              console.log(`✅ Finished executing: ${fileName}`);
              resolve();
            } else {
              if (tolerant) {
                console.warn(`⚠️ Warning: SQL file ${fileName} execution warning (code ${exitCode}). Continuing... Stderr: ${stderr.trim()}`);
                resolve();
              } else {
                reject(new Error(`SQL file execution failed with code ${exitCode}. Stderr: ${stderr}`));
              }
            }
          }).on('data', (data) => {
            process.stdout.write(data);
          }).stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
          });
        });
      }).on('data', d => console.log(d.toString()));
    });
  });
}
