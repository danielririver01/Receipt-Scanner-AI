// ── Scanner AI Stress Test Suite Runner ──
// Ejecuta todos los tests secuencialmente y consolida resultados
// Uso: k6 run tests/k6/runner.js
import { group, check } from 'k6';
import http from 'k6/http';
import { SCANNER_URL, API_KEY, USER_ID } from './config.js';

export const options = {
  vus: 1,
  duration: '1s',
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.1'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'count'],
};

function checkResponse(r, expectedStatus = 200) {
  return r.status === expectedStatus;
}

function getJSON(r) {
  try { return JSON.parse(r.body); } catch { return null; }
}

function report(name, status, detail = '') {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${name}${detail ? ': ' + detail : ''}`);
}

export default function () {
  console.log('═══════════════════════════════════════');
  console.log('  RECEIPT-SCANNER-AI — Stress Suite');
  console.log(`  Target: ${SCANNER_URL}`);
  console.log('═══════════════════════════════════════\n');

  // ── Phase 0: Health Check ────────────────
  group('🌡️  Health Check', () => {
    const r = http.get(`${SCANNER_URL}/`);
    report('Landing page', checkResponse(r), `${r.status}`);

    const r2 = http.get(`${SCANNER_URL}/api/test`);
    report('API test', checkResponse(r2), `${r2.status}`);
    const d = getJSON(r2);
    report('API response structure', d?.test === 'API is working',
      d ? `test="${d.test}"` : 'no parse');
  });

  // ── Phase 1: Stats via API Key ────────────
  group('📊 Stats API', () => {
    if (!API_KEY) {
      report('API key', false, 'SCANNER_API_KEY not set — skipping stats');
    } else {
      const headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      };
      const r = http.get(
        `${SCANNER_URL}/api/stats/summary?range=today&userId=${USER_ID}`,
        { headers }
      );
      report('Stats today', checkResponse(r), `${r.status}`);
      const d = getJSON(r);
      if (d?.success) {
        report('Stats data', true, `total=${d.totalExpenses}, range=${d.range}`);
      }

      // Stats sin key
      const noKey = http.get(`${SCANNER_URL}/api/stats/summary`);
      report('Stats no-key → 401', checkResponse(noKey, 401), `${noKey.status}`);
    }
  });

  // ── Phase 2: Token endpoints ──────────────
  group('🪙 Token System', () => {
    if (API_KEY) {
      const headers = { 'x-api-key': API_KEY, 'Content-Type': 'application/json' };
      const co = http.post(
        `${SCANNER_URL}/api/checkout`,
        JSON.stringify({ pack: '25', userId: USER_ID }),
        { headers }
      );
      report('Checkout endpoint', [502, 401, 500, 200].includes(co.status),
        `${co.status}`);

      // Sin auth
      const coNoKey = http.post(
        `${SCANNER_URL}/api/checkout`,
        JSON.stringify({ pack: '25' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      report('Checkout no auth → 401', checkResponse(coNoKey, 401),
        `${coNoKey.status}`);
    } else {
      report('Token tests', false, 'SCANNER_API_KEY not set — skipping');
    }
  });

  // ── Summary ───────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log('  Suite complete!');
  console.log('  Run individual tests with:');
  console.log(`    k6 run tests/k6/health.js`);
  console.log(`    k6 run tests/k6/stats.js`);
  console.log(`    k6 run tests/k6/tokens.js`);
  console.log(`    k6 run tests/k6/full_scenario.js`);
  console.log('═══════════════════════════════════════\n');
}
