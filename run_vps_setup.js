const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.205.182.94',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:/Users/Edwin/.ssh/id_rsa_cloudfly'),
  readyTimeout: 120000
};

const remoteScript = `
set -e
echo "==> Checking Qdrant collection 'products'..."
status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:6333/collections/products || echo "000")
if [ "$status" = "200" ]; then
  echo "Qdrant collection 'products' already exists."
else
  echo "Creating Qdrant collection 'products'..."
  curl -s -X PUT "http://127.0.0.1:6333/collections/products" -H "Content-Type: application/json" -d '{"vectors":{"size":1536,"distance":"Cosine"}}' || echo "Qdrant create request failed"
fi

echo "==> Ensuring Kafka topic 'product.updates' exists..."
if docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list | grep -q "^product.updates$"; then
  echo "Kafka topic 'product.updates' already exists."
else
  echo "Creating Kafka topic 'product.updates'..."
  docker exec kafka kafka-topics --bootstrap-server localhost:9092 --create --if-not-exists --replication-factor 1 --partitions 1 --topic product.updates || echo "Kafka topic creation failed"
fi

echo "==> Done."
`;

conn.on('ready', () => {
  console.log('✅ Connected to VPS. Running setup script...');
  conn.exec('bash -s', (err, stream) => {
    if (err) {
      console.error('❌ SSH exec error:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log(`✅ Remote setup finished (code=${code}, signal=${signal})`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    stream.end(remoteScript);
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
}).connect(config);
