// ============================================================
// MEGA MART — PM2 Ecosystem Configuration
// Production process manager for self-hosted deployments
// ============================================================

module.exports = {
  apps: [
    {
      name: 'megamart',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/app',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 10000,
      listen_timeout: 30000,
      shutdown_with_message: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      error_file: '/var/log/megamart/error.log',
      out_file: '/var/log/megamart/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Health monitoring
      min_uptime: '10s',
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/megamart.git',
      path: '/var/www/megamart',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'deploy',
      host: 'staging.your-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/megamart.git',
      path: '/var/www/megamart-staging',
      'post-deploy':
        'npm install && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
