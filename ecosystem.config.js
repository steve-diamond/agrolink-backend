/**
 * PM2 Ecosystem – production cluster config
 * Usage: pm2 start ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: 'agrolink-api',
      script: 'server.js',
      // Run one primary process; server.js manages worker clustering.
      exec_mode: 'fork',
      instances: 1,
      // Restart if memory exceeds 512 MB (guards against memory leaks)
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Zero-downtime deploys: wait for new worker to be ready before killing the old one
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      // Exponential back-off restart on crash
      exp_backoff_restart_delay: 100,
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
