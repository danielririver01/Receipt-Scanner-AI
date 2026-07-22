// ── Scanner AI — Token system stress test ──
// Nota: endpoint /api/tokens/status requiere Clerk auth.
// Probamos lo que podemos: stats (via API key) y el proxy checkout.
// Para pruebas reales de concurrencia en consumeToken(), ver el
// test de Prisma $transaction en el código.

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
  group('🪙 Token System', () => {
    if (!API_KEY) {
      console.warn('[tokens] SCANNER_API_KEY not set — skipping');
      return;
    }

    const headers = {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    };

    // Health de las APIs protegidas no-Clerk
    const statsToday = http.get(
      `${SCANNER_URL}/api/stats/summary?range=today&userId=${USER_ID}`,
      { headers }
    );
    check(statsToday, {
      'token-proxy: stats 200': (r) => r.status === 200,
    });

    // Checkout endpoint — simula compra de tokens (falla en ST porque
    // no hay Flask corriendo, pero verifica que Next.js responde)
    const checkout = http.post(
      `${SCANNER_URL}/api/checkout`,
      JSON.stringify({ pack: '25', userId: USER_ID }),
      { headers }
    );
    check(checkout, {
      'checkout responds (expect 502/401 without Clerk)': (r) =>
        r.status === 502 || r.status === 401 || r.status === 500,
    });

    // Sin API key → stats debe fallar con 401
    const noKey = http.get(`${SCANNER_URL}/api/stats/summary`);
    check(noKey, {
      'stats sin api-key → 401': (r) => r.status === 401,
    });
  });
  sleep(0.5);
}
