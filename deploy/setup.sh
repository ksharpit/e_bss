#!/bin/bash
# ============================================
# Electica BSS - EC2 Server Setup Script
# Run this on a fresh Ubuntu 22.04+ EC2 instance
# ============================================

set -e

echo "=== Updating system ==="
sudo apt update && sudo apt upgrade -y

echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== Installing nginx ==="
sudo apt install -y nginx

echo "=== Installing PM2 ==="
sudo npm install -g pm2

# ============================================
# PostgreSQL + TimescaleDB
# ============================================
echo "=== Installing PostgreSQL ==="
sudo apt install -y gnupg postgresql-common apt-transport-https lsb-release wget
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
sudo apt install -y postgresql-16

echo "=== Installing TimescaleDB ==="
# Add TimescaleDB repo
echo "deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main" | sudo tee /etc/apt/sources.list.d/timescaledb.list
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/timescaledb.gpg
sudo apt update
sudo apt install -y timescaledb-2-postgresql-16

# Configure TimescaleDB
sudo timescaledb-tune --quiet --yes
sudo systemctl restart postgresql

echo "=== Setting up Electica database ==="
sudo -u postgres psql -c "CREATE USER electica WITH PASSWORD 'electica';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE electica_bss OWNER electica;" 2>/dev/null || true
sudo -u postgres psql -d electica_bss -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
sudo -u postgres psql -d electica_bss -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO electica;"
sudo -u postgres psql -d electica_bss -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO electica;"

# ============================================
# Mosquitto MQTT Broker
# ============================================
echo "=== Installing Mosquitto MQTT Broker ==="
sudo apt install -y mosquitto mosquitto-clients

# Configure Mosquitto for external connections
sudo tee /etc/mosquitto/conf.d/electica.conf > /dev/null <<EOF
listener 1883
allow_anonymous true
max_connections 100

# WebSocket listener (optional, for browser clients)
listener 9001
protocol websockets
allow_anonymous true
EOF

sudo systemctl enable mosquitto
sudo systemctl restart mosquitto

# ============================================
# App directories
# ============================================
echo "=== Creating app directories ==="
sudo mkdir -p /var/www/electica/admin
sudo mkdir -p /var/www/electica/provider
sudo mkdir -p /var/www/electica/user

echo "=== Setting up nginx config ==="
sudo cp /tmp/electica-nginx.conf /etc/nginx/sites-available/electica
sudo ln -sf /etc/nginx/sites-available/electica /etc/nginx/sites-enabled/electica
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Services running:"
echo "  - PostgreSQL 16 + TimescaleDB (port 5432)"
echo "  - Mosquitto MQTT Broker (port 1883, WebSocket 9001)"
echo "  - nginx (port 80)"
echo ""
echo "Database:"
echo "  - DB: electica_bss"
echo "  - User: electica / electica"
echo "  - Connection: postgresql://electica:electica@localhost:5432/electica_bss"
echo ""
echo "MQTT:"
echo "  - Broker: mqtt://YOUR_EC2_IP:1883"
echo "  - Topic: electica/battery/{deviceId}/telemetry"
echo ""
echo "Next steps:"
echo "  1. Run schema: sudo -u postgres psql -d electica_bss -f /var/www/electica/server/schema.sql"
echo "  2. Run migration: cd /var/www/electica && node server/migrate-from-json.js"
echo "  3. Start API: pm2 start ecosystem.config.cjs && pm2 save && pm2 startup"
echo "  4. Open port 1883 in EC2 Security Group for MQTT"
