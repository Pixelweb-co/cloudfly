const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000
};

conn.on('ready', () => {
  console.log('✅ Connected to VPS. Simulating Evolution API webhook payload...');
  
  const payload = {
    event: 'messages.upsert',
    instance: 'cloudfly_t79_c80',
    data: {
      key: {
        remoteJid: '573245640657@s.whatsapp.net',
        fromMe: false,
        id: 'SIMULATED_MSG_ID_' + Date.now()
      },
      pushName: 'Edwin Cliente Camila Spa',
      message: {
        conversation: 'Hola, me gustaría agendar una cita en Camila Spa. ¿Tienen disponibilidad?'
      },
      messageType: 'conversation'
    }
  };

  // Convertimos el payload a una cadena JSON escapando comillas para bash
  const payloadStr = JSON.stringify(payload).replace(/"/g, '\\"');
  
  // Enviamos una petición POST local en la VPS usando curl directamente al chat_socket en su puerto interno 3001
  const cmd = `curl -X POST -H "Content-Type: application/json" -d "${payloadStr}" http://localhost:3001/webhook/evolution`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n✅ Simulated webhook HTTP POST completed with exit code ${code}`);
      
      // Esperamos 2 segundos para dar tiempo al procesamiento asíncrono y luego consultamos el contacto creado
      console.log('🔍 Checking if contact was created in the database...');
      setTimeout(() => {
        const sql = `USE cloud_master; SELECT id, uuid, name, phone, tenant_id, company_id, type, stage_id FROM contacts WHERE phone = '573245640657' AND tenant_id = 79;`;
        const dbCmd = `docker exec -i mysql mysql -uroot -pwidowmaker -e "${sql}"`;
        
        conn.exec(dbCmd, (dbErr, dbStream) => {
          if (dbErr) throw dbErr;
          dbStream.on('close', () => conn.end())
                  .on('data', d => process.stdout.write(d))
                  .stderr.on('data', d => process.stderr.write(d));
        });
      }, 2000);
      
    }).on('data', (data) => {
      process.stdout.write('Response: ' + data.toString() + '\n');
    }).stderr.on('data', (data) => {
      process.stderr.write('Stderr: ' + data.toString() + '\n');
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
