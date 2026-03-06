// PM2 Ecosystem File - Electica BSS
module.exports = {
  apps: [
    {
      name: 'electica-api',
      script: 'npx',
      args: 'json-server db.json --port 3001 --host 0.0.0.0',
      cwd: '/var/www/electica',
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '200M',
    },
  ],
};
