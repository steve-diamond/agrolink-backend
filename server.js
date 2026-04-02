require('dotenv').config();

const cluster = require('cluster');
const os = require('os');

const WORKERS = process.env.WEB_CONCURRENCY
  ? Number(process.env.WEB_CONCURRENCY)
  : os.availableParallelism
  ? os.availableParallelism()
  : os.cpus().length;

// In production, fork one worker per logical CPU core.
// In development (NODE_ENV !== 'production') stay single-process for easy debugging.
if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`Primary ${process.pid} starting ${WORKERS} workers`);

  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} exited (${signal || code}). Restarting…`);
    cluster.fork();
  });
} else {
  const app = require('./app');
  const connectDB = require('./config/db');
  const ensureAdminUser = require('./utils/ensureAdminUser');

  const PORT = process.env.PORT || 5000;

  const start = async () => {
    try {
      await connectDB();
      // Only seed admin from the first worker (or single-process dev)
      if (!cluster.isWorker || cluster.worker.id === 1) {
        await ensureAdminUser();
      }
      const server = app.listen(PORT, () => {
        console.log(`Worker ${process.pid} listening on port ${PORT}`);
      });

      // Graceful shutdown: stop accepting new connections, finish in-flight requests.
      const shutdown = (signal) => {
        console.log(`${signal} received – shutting down worker ${process.pid}`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 10_000).unref();
      };
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (err) {
      console.warn('⚠️  MongoDB connection failed, starting anyway (dev mode):', err.message);
      app.listen(PORT, () => {
        console.log(`Worker ${process.pid} running on port ${PORT} (without MongoDB)`);
      });
    }
  };

  start();
}