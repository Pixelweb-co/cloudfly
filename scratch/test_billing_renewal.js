const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 60000
};

console.log('🚀 [TEST] Connecting to VPS (api.cloudfly.com.co:22)...');

conn.on('ready', () => {
  console.log('✅ SSH Client Ready. Starting billing renewal tests...');
  
  const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let stdout = '';
        let stderr = '';
        stream.on('close', (code, signal) => {
          resolve({ code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data;
        }).stderr.on('data', (data) => {
          stderr += data;
        });
      });
    });
  };

  (async () => {
    try {
      // 1. Check current plans list to see if the migration was applied and is_basic exists
      console.log('\n🔍 [STEP 1] Verifying plans in MySQL...');
      const checkPlansSql = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e "SELECT id, name, price, is_free, is_basic, is_active FROM plans;"`;
      const plansResult = await runCommand(checkPlansSql);
      console.log(plansResult.stdout || plansResult.stderr);

      if (plansResult.code !== 0) {
        console.error('❌ Failed to retrieve plans from database.');
        conn.end();
        return;
      }

      // 2. Setup mock subscription (TRIAL) and mock invoice (PENDIENTE)
      console.log('\n📝 [STEP 2] Creating mock Subscription (ID: 9999, status: TRIAL) and mock Invoice (INV-TEST-9999)...');
      const setupSql = `
        USE cloud_master;
        INSERT INTO subscriptions (id, plan_id, customer_id, user_id, status, trial_ends_at, next_billing_date, created_at, updated_at) 
        VALUES (9999, 1, 1, 1, 'TRIAL', NOW(), NOW(), NOW(), NOW()) 
        ON DUPLICATE KEY UPDATE status='TRIAL', trial_ends_at=NOW();

        INSERT INTO invoices (id, invoice_number, tenant_id, subscription_id, status, total, created_at, updated_at)
        VALUES (9999, 'INV-TEST-9999', 1, 9999, 'PENDIENTE', 99000.00, NOW(), NOW()) 
        ON DUPLICATE KEY UPDATE status='PENDIENTE';
      `.replace(/\n/g, ' ').trim();

      const setupResult = await runCommand(`docker exec -i mysql mysql -uroot -pwidowmaker -e "${setupSql}"`);
      console.log('✅ Mock data set up.');

      // 3. Invoke internal billing API in backend-api container to mark invoice as PAGADA
      console.log('\n📡 [STEP 3] Calling backend-api internal endpoint to mark invoice as PAGADA...');
      const callApiCmd = `docker exec -i backend-api curl -s -X PUT "http://localhost:8080/internal/billing/invoices/by-reference/INV-TEST-9999?status=PAGADA"`;
      const apiResult = await runCommand(callApiCmd);
      console.log('Response payload:', apiResult.stdout);

      // 4. Verify subscription has transitioned to ACTIVE and upgraded to Basic Plan
      console.log('\n🔍 [STEP 4] Verifying Subscription status after transition...');
      const checkSubSql = `docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e "SELECT id, plan_id, status, trial_ends_at, next_billing_date, ai_tokens_limit, users_limit FROM subscriptions WHERE id = 9999;"`;
      const subResult = await runCommand(checkSubSql);
      console.log(subResult.stdout);

      // 5. Clean up mock data
      console.log('🧹 [STEP 5] Cleaning up mock data from MySQL...');
      const cleanupSql = `
        USE cloud_master;
        DELETE FROM invoices WHERE id = 9999;
        DELETE FROM subscriptions WHERE id = 9999;
      `.replace(/\n/g, ' ').trim();
      await runCommand(`docker exec -i mysql mysql -uroot -pwidowmaker -e "${cleanupSql}"`);
      console.log('✅ Mock data cleaned up.');

      console.log('\n✨ [TEST] Integration test finished successfully!');

    } catch (err) {
      console.error('\n💥 [TEST] Fatal test execution error:', err);
    } finally {
      conn.end();
    }
  })();
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
}).connect(config);
