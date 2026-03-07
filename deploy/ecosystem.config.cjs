// PM2 Ecosystem File - Electica BSS
module.exports = {
  apps: [
    {
      name: 'electica-api',
      script: 'server/index.js',
      cwd: '/var/www/electica',
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '200M',
    },
  ],
};
