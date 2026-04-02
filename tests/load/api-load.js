import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  scenarios: {
    health_and_reads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 150 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // SLO targets
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checks: ['rate>0.99'],
  },
};

function hit(path, tags = {}) {
  const res = http.get(`${BASE_URL}${path}`, { tags });
  check(res, {
    [`${path} status is 200/401/403`]: (r) => [200, 401, 403].includes(r.status),
  });
}

export default function () {
  hit('/health', { endpoint: 'health' });
  hit('/ready', { endpoint: 'ready' });
  hit('/api/products?page=1&limit=20', { endpoint: 'products' });
  hit('/api/orders?page=1&limit=20', { endpoint: 'orders' });
  sleep(1);
}
