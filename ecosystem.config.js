module.exports = {
  apps: [
    {
      name: 'pos-advanced',
      script: 'npm',
      args: 'run start',
      cwd: 'C:\\Users\\Administrator\\Documents\\pos\\POS-ADVANCED',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
