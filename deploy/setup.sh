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

echo "=== Creating app directories ==="
sudo mkdir -p /var/www/electica/admin
sudo mkdir -p /var/www/electica/provider
sudo mkdir -p /var/www/electica/user

echo "=== Setting up nginx config ==="
sudo cp /tmp/electica-nginx.conf /etc/nginx/sites-available/electica
sudo ln -sf /etc/nginx/sites-available/electica /etc/nginx/sites-enabled/electica
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "=== Done! ==="
echo ""
echo "Next steps:"
echo "  1. Upload built files to /var/www/electica/"
echo "  2. Upload db.json to /var/www/electica/"
echo "  3. Run: cd /var/www/electica && pm2 start ecosystem.config.js"
echo "  4. Run: pm2 save && pm2 startup"
