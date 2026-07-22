// ── Scanner AI — Full scenario stress test ──
// Simula un usuario real navegando por la app.
// 1. Landing page
// 2. API test
// 3. Stats summary (vía API key)
// 4. Checkout proxy
// Nota: Clerk auth no está disponible en k6, por lo que los
// endpoints protegidos (dashboard, tokens/status) no se prueban.

import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { SCANNER_URL, API_KEY, USER_ID } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '1m', target: 30 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.10'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'count'],
};

function tryJSON(body) {
  try { return JSON.parse(body); } catch { return null; }
}

function check200(res, label) {
  return check(res, {
    [`${label} 200`]: (r) => r.status === 200,
    [`${label} body OK`]: (r) => r.body && r.body.length > 0,
  });
}

export default function () {
  // ── 1. Landing ──
  group('🏠 Landing', () => {
    const r = http.get(`${SCANNER_URL}/`);
    check200(r, 'landing');
  });
  sleep(0.3);

  // ── 2. Health API ──
  group('🔬 Health', () => {
    const r = http.get(`${SCANNER_URL}/api/test`);
    const ok = check200(r, 'api/test');
    if (ok) {
      const d = tryJSON(r.body);
      check(r, {
        'api/test has test field': () => d?.test === 'API is working',
      });
    }
  });
  sleep(0.3);

  // ── 3. Stats (API key) ──
  group('📊 Stats', () => {
    if (!API_KEY) {
      console.warn('[scenario] SCANNER_API_KEY not set — skipping stats');
      return;
    }

    const headers = {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    };

    const ranges = ['today', 'month'];
    for (const range of ranges) {
      const r = http.get(
        `${SCANNER_URL}/api/stats/summary?range=${range}&userId=${USER_ID}`,
        { headers }
      );
      check200(r, `stats/${range}`);
      sleep(0.2);
    }

    // Stats sin API key → debe fallar
    const noKey = http.get(`${SCANNER_URL}/api/stats/summary`);
    check(noKey, {
      'stats/no-key 401': (r) => r.status === 401,
    });
  });
  sleep(0.3);

  // ── 4. Checkout proxy ──
  group('💳 Checkout', () => {
    const r = http.post(
      `${SCANNER_URL}/api/checkout`,
      JSON.stringify({ pack: '25', userId: USER_ID }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    // 401 sin Clerk, 502 si Flask no está, 200 si todo funciona
    check(r, {
      'checkout responds': (r) => [200, 401, 502, 500].includes(r.status),
    });
  });
  sleep(0.3);
}
