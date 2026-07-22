// ── Scanner AI — Health check + public pages ──
import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { SCANNER_URL } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  group('🌡️  Health Check', () => {
    // Landing page
    const landing = http.get(`${SCANNER_URL}/`);
    check(landing, {
      'landing page 200': (r) => r.status === 200,
      'landing page loads fast': (r) => r.timings.duration < 1000,
    });

    // API test endpoint
    const apiTest = http.get(`${SCANNER_URL}/api/test`);
    check(apiTest, {
      'api/test 200': (r) => r.status === 200,
      'api/test returns JSON': (r) => {
        try { return JSON.parse(r.body).test === 'API is working'; }
        catch { return false; }
      },
    });
  });
  sleep(0.5);
}
