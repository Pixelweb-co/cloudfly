#!/bin/bash
set -e

echo "🛑 Stopping backend-api container..."
docker stop backend-api || true

echo "📂 Copying SQL files into the mysql container..."
docker cp /tmp/cloud_master_inicial_final_mayo_2026.sql mysql:/tmp/
docker cp /tmp/add_new_features_tables.sql mysql:/tmp/

echo "🔄 Restoring original backup SQL..."
docker exec mysql mysql -u root -pwidowmaker cloud_master -e "source /tmp/cloud_master_inicial_final_mayo_2026.sql"

echo "🔄 Applying new features schemas..."
docker exec mysql mysql -u root -pwidowmaker cloud_master -e "source /tmp/add_new_features_tables.sql"

echo "🚀 Restarting backend-api container..."
docker start backend-api || true

echo "🔄 Generating unified clean database dump..."
docker exec mysql mysqldump -u root -pwidowmaker cloud_master > /tmp/cloud_master_clean_install.sql

echo "🧹 Cleaning up temporary files inside container..."
docker exec mysql rm -f /tmp/cloud_master_inicial_final_mayo_2026.sql /tmp/add_new_features_tables.sql

echo "✅ All database operations completed successfully!"
