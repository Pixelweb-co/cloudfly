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
  console.log('✅ Connected to VPS. Querying Orders & Invoices details...');
  
  const query = `
    USE cloud_master;
    SELECT '=== ALL ORDERS ===' as '';
    SELECT id, tenant_id, company_id, customer_id, customer_name, order_number, total, created_at FROM orders;

    SELECT '=== ORDER ITEMS ===' as '';
    SELECT id, order_id, product_id, product_name, quantity, unit_price, total FROM order_items;

    SELECT '=== ALL INVOICES ===' as '';
    SELECT id, tenant_id, company_id, customer_id, invoice_number, total, status, created_at FROM invoices;
  `;

  // Escape query for bash double quotes
  const escapedQuery = query.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `docker exec -i mysql mysql -u root -pwidowmaker -e "${escapedQuery}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
