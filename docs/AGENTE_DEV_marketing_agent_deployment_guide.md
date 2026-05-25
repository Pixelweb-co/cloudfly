# 🤖 Marketing Agent Microservice - Deployment Guide

## Overview

This document provides comprehensive deployment instructions for the Marketing Agent Microservice, including environment setup, Docker configuration, and operational procedures.

---

## 1. Prerequisites

### 1.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 512 MB | 1 GB |
| Disk | 1 GB | 5 GB |
| Network | 100 Mbps | 1 Gbps |

### 1.2 Software Dependencies

| Software | Version | Purpose |
|----------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Docker Compose | 2.0+ | Multi-container orchestration |
| Python | 3.11+ | Development (optional) |
| MySQL Client | 8.0+ | Database debugging |

### 1.3 Network Access

Ensure the following endpoints are accessible:

| Service | URL | Port | Protocol |
|---------|-----|------|----------|
| Backend API | `backend:8080` | 8080 | HTTP |
| Evolution API | `evolution-api:8080` | 8080 | HTTP |
| MySQL | `mysql:3306` | 3306 | TCP |
| Kafka (optional) | `kafka:9092` | 9092 | TCP |

---

## 2. Environment Configuration

### 2.1 Create .env File

```bash
cd marketing_agent
cp .env.example .env
```

### 2.2 Configure Environment Variables

```env
# =============================================
# Marketing Agent Configuration
# =============================================

# Backend API Configuration
BACKEND_URL=http://backend:8080
BACKEND_API_KEY=your_backend_api_key_here

# Evolution API Configuration
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=your_evolution_api_key_here
EVOLUTION_INSTANCE=cloudfly-main

# Database Configuration
DB_HOST=mysql_host
DB_PORT=3306
DB_NAME=cloud_master
DB_USER=root
DB_PASSWORD=your_db_password_here

# Campaign Configuration
TENANT_ID=1
COMPANY_ID=1

# Anti-Spam Configuration
MIN_DELAY_MS=3000
MAX_DELAY_MS=12000
BATCH_SIZE=20
BATCH_PAUSE_MS=30000

# Logging
LOG_LEVEL=INFO
```

### 2.3 Validate Configuration

```bash
# Test configuration loading
python -c "from config import Config; print('Config loaded successfully')"
```

---

## 3. Docker Deployment

### 3.1 Build Docker Image

```bash
# Build the image
docker build -t marketing-agent:latest .

# Verify image was created
docker images | grep marketing-agent
```

**Expected output**:
```
marketing-agent   latest    abc123def456   10 seconds ago   150MB
```

### 3.2 Run Container

```bash
# Run with environment file
docker run -d \
  --name marketing-agent \
  --env-file .env \
  --network cloudfly-network \
  --restart on-failure \
  marketing-agent:latest

# Verify container is running
docker ps | grep marketing-agent
```

### 3.3 Docker Compose Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  marketing-agent:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: marketing-agent
    env_file:
      - .env
    restart: on-failure
    networks:
      - cloudfly-network
    depends_on:
      - backend
      - evolution-api
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8080/health')"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  cloudfly-network:
    external: true
```

**Deploy with Docker Compose**:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f marketing-agent

# Stop services
docker-compose down
```

---

## 4. Kubernetes Deployment (Optional)

### 4.1 Create Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: marketing-agent
  namespace: cloudfly
  labels:
    app: marketing-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: marketing-agent
  template:
    metadata:
      labels:
        app: marketing-agent
    spec:
      containers:
      - name: marketing-agent
        image: marketing-agent:latest
        envFrom:
        - secretRef:
            name: marketing-agent-secrets
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          exec:
            command:
            - python
            - -c
            - "import requests; requests.get('http://localhost:8080/health')"
          initialDelaySeconds: 30
          periodSeconds: 30
```

### 4.2 Create Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: marketing-agent-secrets
  namespace: cloudfly
type: Opaque
stringData:
  BACKEND_URL: "http://backend:8080"
  BACKEND_API_KEY: "your_api_key"
  EVOLUTION_API_URL: "http://evolution-api:8080"
  EVOLUTION_API_KEY: "your_evolution_key"
  DB_HOST: "mysql-host"
  DB_PORT: "3306"
  DB_NAME: "cloud_master"
  DB_USER: "root"
  DB_PASSWORD: "your_db_password"
  TENANT_ID: "1"
  COMPANY_ID: "1"
```

### 4.3 Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f secret.yaml

# Verify deployment
kubectl get pods -n cloudfly | grep marketing-agent

# View logs
kubectl logs -f deployment/marketing-agent -n cloudfly
```

---

## 5. Verification Procedures

### 5.1 Pre-Deployment Checks

```bash
# 1. Verify backend API is accessible
curl -H "Authorization: Bearer $BACKEND_API_KEY" \
  "$BACKEND_URL/productos/tenant/$TENANT_ID"

# 2. Verify Evolution API is accessible
curl -H "apikey: $EVOLUTION_API_KEY" \
  "$EVOLUTION_API_URL/instance/fetchInstances"

# 3. Verify MySQL connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  -e "SELECT COUNT(*) FROM cloud_master.contacts WHERE tenant_id = $TENANT_ID"

# 4. Verify Docker image builds
docker build -t marketing-agent:test .
```

### 5.2 Post-Deployment Checks

```bash
# 1. Check container status
docker ps -a | grep marketing-agent

# 2. View container logs
docker logs marketing-agent --tail 50

# 3. Execute test run
docker exec marketing-agent python -m pytest test_marketing_agent.py -v

# 4. Verify network connectivity
docker exec marketing-agent ping -c 3 backend
docker exec marketing-agent ping -c 3 evolution-api
```

### 5.3 Integration Testing

```bash
# Run integration test
python -m pytest test_integration.py -v

# Manual test with dry run
python main.py --dry-run --tenant-id 1 --company-id 1
```

---

## 6. Monitoring and Logging

### 6.1 Log Configuration

```python
# config.py - Logging settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
LOG_FILE = os.getenv("LOG_FILE", "/var/log/marketing-agent.log")
```

### 6.2 Log Rotation

```bash
# /etc/logrotate.d/marketing-agent
/var/log/marketing-agent.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```

### 6.3 Health Check Endpoint

```python
# Add to main.py for monitoring
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })

if __name__ == "__main__":
    # Start health check server in background
    import threading
    threading.Thread(target=lambda: app.run(host='0.0.0.0', port=8080)).start()
    
    # Run main agent
    agent = MarketingAgent()
    agent.run()
```

### 6.4 Prometheus Metrics (Optional)

```python
from prometheus_client import Counter, Histogram, start_http_server

# Define metrics
MESSAGES_SENT = Counter('messages_sent_total', 'Total messages sent')
MESSAGE_LATENCY = Histogram('message_send_latency_seconds', 'Message send latency')

# Start metrics server
start_http_server(9090)
```

---

## 7. Troubleshooting

### 7.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Connection refused` to Backend API | Backend not running or wrong URL | Check `BACKEND_URL` and backend status |
| `401 Unauthorized` | Invalid API key | Verify `BACKEND_API_KEY` |
| `ProductNotFoundException` | No active product with image | Ensure backend has valid product |
| `MySQL Connection Error` | Database unreachable | Check `DB_HOST`, credentials, network |
| `Evolution API Timeout` | API overloaded | Increase timeout, check API status |
| `Container exits immediately` | Configuration error | Check logs: `docker logs marketing-agent` |

### 7.2 Debug Commands

```bash
# Check container logs
docker logs marketing-agent --tail 100

# Inspect container environment
docker exec marketing-agent env

# Test network connectivity
docker exec marketing-agent curl -v $BACKEND_URL/health

# Check database connectivity
docker exec marketing-agent python -c "
import mysql.connector
conn = mysql.connector.connect(
    host='$DB_HOST',
    user='$DB_USER',
    password='$DB_PASSWORD',
    database='$DB_NAME'
)
print('DB connection successful')
conn.close()
"

# Run with debug logging
docker run -e LOG_LEVEL=DEBUG marketing-agent
```

### 7.3 Recovery Procedures

```bash
# Restart container
docker restart marketing-agent

# Rebuild and redeploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Rollback to previous version
docker tag marketing-agent:previous marketing-agent:latest
docker restart marketing-agent
```

---

## 8. Scaling Considerations

### 8.1 Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  marketing-agent:
    build: .
    env_file: .env
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    environment:
      - INSTANCE_ID={{.Task.Slot}}
```

### 8.2 Queue-Based Processing

For high-volume campaigns, integrate with Kafka:

```python
# kafka_consumer.py
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'campaign-worker-queue',
    bootstrap_servers=['kafka:9092'],
    group_id='marketing-agent-group',
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

for message in consumer:
    campaign_data = message.value
    agent = MarketingAgent()
    agent.run_campaign(campaign_data)
```

---

## 9. Security Hardening

### 9.1 Docker Security

```dockerfile
# Use non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Read-only filesystem
docker run --read-only --tmpfs /tmp marketing-agent
```

### 9.2 Secret Management

```bash
# Use Docker secrets
echo "my_secret_key" | docker secret create backend_api_key -

# Reference in docker-compose
secrets:
  backend_api_key:
    external: true
```

### 9.3 Network Policies

```yaml
# kubernetes/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: marketing-agent-policy
spec:
  podSelector:
    matchLabels:
      app: marketing-agent
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - podSelector:
        matchLabels:
          app: evolution-api
    ports:
    - protocol: TCP
      port: 8080
```

---

## 10. Maintenance Procedures

### 10.1 Regular Maintenance

| Task | Frequency | Command |
|------|-----------|---------|
| Log rotation | Daily | `logrotate /etc/logrotate.d/marketing-agent` |
| Image updates | Weekly | `docker pull marketing-agent:latest` |
| Database cleanup | Monthly | `DELETE FROM campaigns WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)` |
| Health checks | Continuous | `curl http://localhost:8080/health` |

### 10.2 Backup Procedures

```bash
# Backup campaign data
mysqldump -u root -p cloud_master campaigns > campaigns_backup_$(date +%Y%m%d).sql

# Backup configuration
cp .env .env.backup.$(date +%Y%m%d)

# Restore from backup
mysql -u root -p cloud_master < campaigns_backup_20240101.sql
```

### 10.3 Update Procedures

```bash
# 1. Pull latest image
docker pull marketing-agent:latest

# 2. Stop current container
docker stop marketing-agent

# 3. Remove old container
docker rm marketing-agent

# 4. Start new container
docker run -d \
  --name marketing-agent \
  --env-file .env \
  --network cloudfly-network \
  --restart on-failure \
  marketing-agent:latest

# 5. Verify deployment
docker logs marketing-agent --tail 20
```

---

## 11. Performance Tuning

### 11.1 Database Optimization

```sql
-- Add composite index for common queries
CREATE INDEX idx_contacts_tenant_company_active 
ON contacts(tenant_id, company_id, is_active);

-- Analyze table statistics
ANALYZE TABLE contacts;
ANALYZE TABLE products;
```

### 11.2 Connection Pooling

```python
# Use connection pooling for better performance
from mysql.connector import pooling

connection_pool = pooling.MySQLConnectionPool(
    pool_name="marketing_pool",
    pool_size=5,
    **db_config
)

# Get connection from pool
conn = connection_pool.get_connection()
```

### 11.3 Caching

```python
# Cache product data to reduce API calls
from functools import lru_cache

@lru_cache(maxsize=128)
def get_cached_product(tenant_id: int) -> dict:
    return product_service.get_active_product_with_image(tenant_id)
```

---

## 12. Disaster Recovery

### 12.1 Recovery Time Objective (RTO)

| Scenario | RTO | Procedure |
|----------|-----|-----------|
| Container crash | 1 min | Auto-restart via Docker |
| Database corruption | 30 min | Restore from backup |
| Complete system failure | 2 hours | Full redeployment |

### 12.2 Recovery Point Objective (RPO)

| Data | RPO | Backup Method |
|------|-----|---------------|
| Campaign data | 24 hours | Daily database backup |
| Configuration | On change | Version control |
| Logs | 7 days | Log rotation |

---

*Deployment Guide generated by Technical Writer Agent for CLOUD-61 Marketing Microservice*
