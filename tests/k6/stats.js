// ── Scanner AI — Stats summary (API-key auth) ──
import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { SCANNER_URL, API_KEY, USER_ID } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  group('📊 Stats API', () => {
    if (!API_KEY) {
      console.warn('[stats] SCANNER_API_KEY not set — skipping');
      return;
    }

    const headers = {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    };

    // Summary for today
    const today = http.get(
      `${SCANNER_URL}/api/stats/summary?range=today&userId=${USER_ID}`,
      { headers }
    );
    check(today, {
      'stats/today 200': (r) => r.status === 200,
      'stats/today returns data': (r) => {
        try { return JSON.parse(r.body).success === true; }
        catch { return false; }
      },
    });

    // Summary for month
    const monthly = http.get(
      `${SCANNER_URL}/api/stats/summary?range=month&userId=${USER_ID}`,
      { headers }
    );
    check(monthly, {
      'stats/month 200': (r) => r.status === 200,
    });

    // Without API key → should fail
    const noKey = http.get(
      `${SCANNER_URL}/api/stats/summary?range=today`
    );
    check(noKey, {
      'stats no-key 401': (r) => r.status === 401,
    });
  });
  sleep(0.5);
}
