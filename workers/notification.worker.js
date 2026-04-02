require('dotenv').config();

const { startNotificationWorker } = require('../services/notificationQueue');

const queue = startNotificationWorker();

if (!queue) {
  process.exit(0);
}

console.log('Notification worker started.');

const shutdown = async (signal) => {
  console.log(`${signal} received. Stopping notification worker...`);
  try {
    await queue.close();
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
