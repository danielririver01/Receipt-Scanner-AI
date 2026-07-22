import { check, sleep } from 'k6'
import http from 'k6/http'
import { SCANNER_URL, API_KEY } from './config.js'

const BASE = SCANNER_URL || 'http://localhost:3000'
const HEADERS = API_KEY ? { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } : {}

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
  },
}

export default function () {
  // 1. Stats without userId — should 401
  {
    const r = http.get(`${BASE}/api/stats/summary`, { headers: HEADERS })
    check(r, {
      'stats no userId → 422 or 401': (res) => res.status === 401 || res.status === 422,
    })
  }

  // 2. Stats with fake userId (non-existent)
  {
    const r = http.get(`${BASE}/api/stats/summary?userId=999999`, { headers: HEADERS })
    check(r, {
      'stats fake userId → 401 or 200(data=0)': (res) =>
        res.status === 401 || (res.status === 200 && JSON.parse(res.body).totalExpenses === 0),
    })
  }

  // 3. Checkout with mismatched userId (IDOR attempt)
  {
    const r = http.post(`${BASE}/api/checkout`, JSON.stringify({ userId: 999999, planId: 'basico' }), {
      headers: { 'Content-Type': 'application/json', ...HEADERS },
    })
    check(r, {
      'checkout fake userId → 401': (res) => res.status === 401,
    })
  }

  // 4. Health test endpoint (public, should always work)
  {
    const r = http.get(`${BASE}/api/test`)
    check(r, {
      'health endpoint → 200': (res) => res.status === 200,
      'health body OK': (res) => JSON.parse(res.body).test === 'API is working',
    })
  }

  sleep(1)
}
