const mongoose = require('mongoose');
const client = require('prom-client');
const { getQueueHealth } = require('../services/notificationQueue');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'agrolink_' });

const httpRequestDurationMs = new client.Histogram({
  name: 'agrolink_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'agrolink_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const normalizeRoute = (req) => {
  if (req.route && req.route.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }

  return req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
};

const metricsMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationMs = Number(durationNs) / 1e6;
    const route = normalizeRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestDurationMs.observe(labels, durationMs);
    httpRequestsTotal.inc(labels);
  });

  next();
};

const metricsHandler = async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

const readinessHandler = async (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  const queueHealth = await getQueueHealth();

  const ready = dbUp && (queueHealth.status === 'up' || queueHealth.status === 'disabled');

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    checks: {
      mongodb: dbUp ? 'up' : 'down',
      redis: queueHealth,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  metricsMiddleware,
  metricsHandler,
  readinessHandler,
};
