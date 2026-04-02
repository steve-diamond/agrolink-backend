const Queue = require('bull');
const { getRedisClient } = require('../config/cache');
const { sendSMS } = require('./smsService');

const SMS_JOB = 'send-sms';
const NOTIFICATION_WORKER_CONCURRENCY = Number(process.env.NOTIFICATION_WORKER_CONCURRENCY || 30);

let notificationQueue = null;

const isQueueEnabled = () => Boolean(process.env.REDIS_URL);

const getNotificationQueue = () => {
  if (!isQueueEnabled()) return null;
  if (notificationQueue) return notificationQueue;

  notificationQueue = new Queue('notification-queue', process.env.REDIS_URL, {
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: 2000,
    },
  });

  notificationQueue.on('error', (error) => {
    console.error(JSON.stringify({ level: 'error', scope: 'notification-queue', msg: error.message }));
  });

  return notificationQueue;
};

const enqueueSms = async ({ to, message, correlationId }) => {
  if (!to || !message) return;

  const queue = getNotificationQueue();
  if (!queue) {
    await sendSMS(to, message);
    return;
  }

  await queue.add(
    SMS_JOB,
    { to, message, correlationId },
    {
      jobId: correlationId ? `${SMS_JOB}:${correlationId}:${to}` : undefined,
    }
  );
};

const startNotificationWorker = () => {
  const queue = getNotificationQueue();
  if (!queue) {
    console.log('Notification worker not started (REDIS_URL is not set).');
    return null;
  }

  queue.process(SMS_JOB, NOTIFICATION_WORKER_CONCURRENCY, async (job) => {
    const { to, message } = job.data;
    await sendSMS(to, message);
  });

  queue.on('completed', (job) => {
    console.log(JSON.stringify({ level: 'info', scope: 'notification-queue', event: 'completed', jobId: job.id }));
  });

  queue.on('failed', (job, err) => {
    console.error(JSON.stringify({
      level: 'error',
      scope: 'notification-queue',
      event: 'failed',
      jobId: job && job.id,
      msg: err.message,
    }));
  });

  return queue;
};

const getQueueHealth = async () => {
  const redis = getRedisClient();
  if (!redis) {
    return { enabled: false, status: 'disabled' };
  }

  try {
    const pong = await redis.ping();
    return {
      enabled: true,
      status: pong === 'PONG' ? 'up' : 'degraded',
      workerConcurrency: NOTIFICATION_WORKER_CONCURRENCY,
    };
  } catch (error) {
    return { enabled: true, status: 'down', error: error.message };
  }
};

module.exports = {
  enqueueSms,
  startNotificationWorker,
  getQueueHealth,
};
