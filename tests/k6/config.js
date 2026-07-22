// ── Receipt-Scanner-AI Stress Test — default config ──
// Sobrescribe con variables de entorno:
//   SCANNER_URL=http://localhost:3000
//   SCANNER_API_KEY=SERVICE_API_KEY
//   SCANNER_USER_ID=1  (test user ID for API-key auth)

export const SCANNER_URL = __ENV.SCANNER_URL || 'http://localhost:3000';
export const API_KEY = __ENV.SCANNER_API_KEY || '';
export const USER_ID = __ENV.SCANNER_USER_ID || '1';
