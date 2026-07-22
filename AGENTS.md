# Receipt-Scanner-AI Agent Guidelines

## Project Overview
Receipt-Scanner-AI is an intelligent expense tracker that automatically scans receipt images, extracts data using OCR + AI, and categorizes expenses. Users have token-based credits for AI processing with different subscription tiers.

**Tech Stack**: Next.js 15 (App Router) • React 19 • TypeScript • Prisma • MariaDB • Clerk Auth • Google Vision + DeepSeek AI • pnpm (no npm)

## Architecture & Key Patterns

### Server Actions (Primary Backend Pattern)
- All business logic in `src/actions/*.ts` marked with `'use server'` directive
- Direct client→server calls without explicit API routes (except external webhooks)
- Always get user context: `const { userId } = await auth()`
- **Cache invalidation pattern**: Call `revalidatePath()` after mutations
  ```typescript
  revalidatePath('/dashboard');  // Refresh dashboard data
  ```

### Data Models & Relationships
```
user (Clerk) ↔ category (many per user, unique by name+userId)
            ↔ expense (amount, date, categoryId, receiptUrl, OCR data, confidence scores)
            ↔ ai_token_wallet (one per user, tracks plan + extra tokens)
            ↔ ai_token_transactions (transaction log; type = "consume" | "refund" | "elite_scan" | "purchase")
```

### Database Quirk
Schema mixes old restaurant data (categories, restaurants, products tables) with user expense system (category, expense, budget tables). **Only use the "velzia_" prefixed tables** (category, expense, budget) for new features—old tables are legacy.

## Authentication & Authorization

### Clerk Integration
- Middleware: `src/middleware.ts` protects routes, redirects `/sign-up` → Flask backend
- All protected routes: `await auth.protect()` in middleware
- **User registration flow**: Sign-up → Flask backend (`NEXT_PUBLIC_FLASK_REGISTER_URL`) → returns to Next.js
- **Token validation**: `requireUserExists()` action checks user exists in database before operations

### Protected Routes
- Public: `/`, `/sign-in`, `/not-registered`, Flask auth routes
- Protected: `/dashboard/*`, `/api/*` (except webhooks)

## AI & OCR Processing

### Token System
- Wallet: `plan_tokens` (subscription) + `extra_tokens` (purchased). `consumeToken()` deducts **exactly 1 token per scan** (prefers `plan_tokens`, falls back to `extra_tokens`); there is no separate per-step DeepSeek cost in code.
- **Elite plan** (`restaurants.plan_type === 'elite'`): scans are unlimited and free — `consumeToken()` records a `0`-cost `elite_scan` transaction and skips deduction. Never show "insufficient tokens" for Elite users.
- Refunds on failure hit `refundToken()`, which restores to `plan_tokens` up to `plan_limit` else `extra_tokens`.

### Receipt Processing Pipeline
1. **User uploads image** → saved to `public/uploads/`, then Base64 buffered in memory
2. **`consumeToken(userId)`** → deducts 1 token (or free for Elite) BEFORE any external call
3. **Google Vision API** → Extract raw text (30-sec timeout, base64 input)
4. **Structured extraction** → DeepSeek API extracts: amount, merchant, date, category, items array (each item has `quantity` + `unit` since V2.4)
5. **Confidence scoring**:
   - `amountConfidence` (0.7-1.0): Higher if line-item sum matches total
   - `itemsConfidence` (0.5-1.0): Higher if receipt structure is clear
6. **Save expense** → Store with OCR data + confidence scores; `revalidatePath()` to update UI
7. **Failure handling** → Refund tokens if processing fails

See [src/actions/ocr.ts](src/actions/ocr.ts) and [src/actions/services/aiStructuring.ts](src/actions/services/aiStructuring.ts) for implementation.

## Escanear tus compras (Hallazgos de precio)

After scanning, the user's items are compared against `velzia_price_history` (all their past purchases of the same product). Pure DB logic in `getPurchaseFindings()` — **no AI, no tokens**. On save, `savePriceHistory()` records every item.

**Product principle (never violate):** *"Escanear tus compras no muestra datos. Descubre cosas que el usuario probablemente no habría visto por sí solo."*

Rules for the findings UI (`FindingsCard.tsx`, header **"🧠 Lo que detecté"**):
- **Max 3 findings**, always, ranked by economic impact (overcost first). Never one card per product (a 27-item receipt must not show 27 cards).
- **Conclusions, not statistics.** Never show raw `avg`/`min`/`max`/`count`. Transform into phrases: e.g. "Hoy pagaste $5.800 más que tu precio habitual" — NOT "Promedio: $39.200".
- Finding types: `unusual` (>15% over avg), `best` (≤ historical min), `trend` (≥3 consecutive increases), `drop` (first reduction after a rise).
- Always show **total overcost** banner when > 0: "Los aumentos detectados representan +$X respecto a tus precios habituales."
- **No StabilityStars / star ratings** — users think "¿me están cobrando más?", not "how stable is this product".
- **V2.2 (done):** Tap the 📈 icon next to any product in `ScannerReview` → `ProductHistoryModal` shows a mini SVG sparkline (`PriceSparkline`) + chips (Habitual/Mínimo/Máximo/Veces) + `trendNote`. Data from `getProductHistory()` (1 query, asc by date). No StabilityStars.
- **V2.3 (done):** Provider memory. `getPurchaseFindings()` adds a `provider` finding when a product has history in ≥2 merchants (≥2 purchases each): *"🟢 {merchant} sigue siendo el más económico"* (current is cheapest) or *"Ojo con el proveedor — En {mejor} sale ~$X más barato"*. `ProductHistoryModal` also shows a "Por proveedor" section: avg per merchant, cheapest highlighted green with a relative bar (no stars).
- **V2.4 (done):** Unit normalization. DeepSeek now extracts `quantity` + `unit` per item (see `aiStructuring.ts` prompt). `savePriceHistory()` computes `normPrice` (price per 100g / 100ml / unit) via `normalizeItem()` and stores it + `normBase`. All comparisons in `getPurchaseFindings()` and `getProductHistory()` use normalized values when available (falls back to raw price when a product lacks unit data), so "500g a $3" vs "1kg a $5" compare fairly. `price_history` gained `normPrice DOUBLE` + `normBase VARCHAR(10)` (added via raw `ALTER TABLE`, Prisma migrations can't run on the shared DB). History modal shows `Habitual (100g)` etc. when normalized.
- **V2.5 (FUTURE — documented, not built):** Cross-supermarket comparison. Note: V2.3 already covers single-user cross-provider memory (Makro vs SuperA from one user's history). True V2.5 would compare *across users* (aggregated, anonymized) to answer "¿dónde está más barato en la ciudad?" — requires privacy review, consent, and substantial history. Deferred: needs much more data + a governance model before building.
- **AI stays off** in V2.1–V2.3. Only rules/SQL. DeepSeek phrasing is a later enhancement, triggered only when a pattern crosses a threshold.

## Development Workflow

### Commands
```bash
pnpm run dev         # Start dev server (auto hot-reload, no restart needed)
pnpm run build       # Production build verification (generates Prisma client)
pnpm lint            # ESLint check (incluye eslint-plugin-security)
pnpm audit           # Dependency audit (19 vulns conocidas, todas transitivas)
# Security audit suite (Orderfox repo):
npm run audit:k6     # k6 headers + JWT + IDOR
npm run audit:gitleaks  # Secret scanning
```

### Important Notes
- **No need to restart dev server** for code changes (Next.js handles hot reload)
- **Run build sparingly**: Only to verify no errors before deployment
- **Never use `next build`** multiple times during development
- **DB is shared with Orderfox** (same MariaDB `orderfox` DB, owned by Flask/Alembic). `npx prisma migrate dev/deploy` FAILS with P3005 (schema not empty). To add a table: edit `prisma/schema.prisma`, run `npx prisma generate`, then create the table via raw SQL: `npx prisma db execute --file migration.sql` (set `$env:DIRECT_URL="mysql://root:root@localhost:3306/orderfox"` first). Local `.env` has an empty root password — the real password is `root` (from docker-compose `MYSQL_ROOT_PASSWORD`).
- New tables must use the `velzia_` prefix (see line 28).
- Migration history:
  - `004_*` — Flask/Alembic (via `flask db upgrade`)
  - `005_add_unique_mp_payment_id.sql` — raw SQL: `ALTER TABLE ai_token_transactions ADD UNIQUE INDEX uq_mp_payment_id (mp_payment_id)`
- **Preview page** at `/preview`: Muestra findings simulados para testear UI sin escanear (`src/app/preview/`)
- **Security**: CSP y headers en `next.config.ts`. Gitleaks bloquea commits con secrets via pre-commit hook. Docker corre como non-root.
- **pnpm-lock.yaml**: Cambios frecuentes al instalar paquetes. Normal.

## Common Tasks & Patterns

### Adding a New Expense Field / Table
1. Update Prisma schema (`prisma/schema.prisma`) — new tables use `velzia_` prefix
2. `npx prisma generate` then create the table with raw SQL (see DB note above — Prisma migrations don't work on the shared DB)
3. Update server action `saveExpense()` in `src/actions/expenses.ts`
4. Update types in `src/types/index.ts` if needed
5. Update dashboard UI to display/input the new field
6. Call `revalidatePath()` after mutations

### Creating a New Category API
1. Create server action in `src/actions/yourfeature.ts` (mark with `'use server'`)
2. Get userId: `const { userId } = await auth()`
3. Use Prisma: `prisma.expense.findMany()`, etc.
4. Call `revalidatePath()` after mutations
5. Import and call from client components

### Handling Token Deductions
- **Always check balance first**: `ai_token_wallets.plan_tokens + extra_tokens`
- **Deduct atomically**: Wrap wallet update + transaction record in `prisma.$transaction()`. Esto elimina el TOCTOU entre la lectura del saldo y la escritura. Ver `consumeToken()` y `refundToken()`.
- **Implement refunds on failure**: If OCR fails, refund the token immediately
- **UNIQUE on mp_payment_id**: Previene doble acreditación del mismo pago MP. Ya aplicado vía `ALTER TABLE` + `@unique` en schema.
- See `tokenService.ts` for token utility functions

### Race Condition Protection (Tokens)
`consumeToken()` y `refundToken()` usan `prisma.$transaction(async (tx) => {...})` para garantizar que:
1. La lectura del wallet ocurre dentro de la transacción (no antes)
2. La verificación de saldo y la deducción son atómicas
3. Si dos requests consumen el último token concurrentemente, una falla con "Tokens insuficientes" en vez de sobregirar

## Code Organization
- `src/actions/` → Server action business logic (expenses, categories, auth)
- `src/actions/services/` → External API integrations (AI, OCR, token management)
- `src/app/` → Next.js pages and layouts (dashboard, auth routes, API webhooks, preview)
- `src/components/` → React components (scanner, charts, forms, modals, findings)
- `src/lib/` → Utility modules (Prisma client, Cloudinary, rate limiter)
- `src/types/` → Shared TypeScript interfaces
- `prisma/` → Prisma schema + migrations
- `tests/` → k6 stress tests + IDOR audit

## Key Files to Know
- **[prisma/schema.prisma](prisma/schema.prisma)** → Complete data model
- **[src/actions/ocr.ts](src/actions/ocr.ts)** → Receipt scanning entry point
- **[src/actions/services/aiStructuring.ts](src/actions/services/aiStructuring.ts)** → AI extraction logic
- **[src/middleware.ts](src/middleware.ts)** → Auth & route protection
- **[src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)** → Main dashboard view
- **[src/lib/rateLimiter.ts](src/lib/rateLimiter.ts)** → Rate limiting (in-memory, API compatible con @upstash)
- **[next.config.ts](next.config.ts)** → Security headers + build config
- **[.gitleaks.toml](.gitleaks.toml)** → Secret scanning config

## Potential Pitfalls
- **Forgetting `revalidatePath()`** after mutations → stale UI data
- **Not checking token balance** before processing → failed operations
- **Mixing old/new schema tables** → confusion with restaurant vs user data
- **Missing `'use server'` directive** → client-side code in server actions
- **Not validating userId** → security vulnerability
- **OCR timeout (30s)** → handle large base64 images that exceed timeout
- **Number input locales**: Colombian format uses `.` as thousand separator and `,` as decimal. Always sanitize with `.replace(/\./g, '').replace(',', '.')` before `parseFloat()`.

## Colombian Currency Format Convention

All monetary values use **formato Colombia**: punto como separador de miles, coma para decimales.

| Código | Ejemplo |
|--------|---------|
| JS display | `total.toLocaleString('es-CO', { minimumFractionDigits: 0 })` → `$1.234.567` |
| JS sanitize | `.replace(/\./g, '').replace(',', '.')` antes de `parseFloat` |
| Dónde se aplica | `CategoriesWrapper`, `ItemListEditor`, `ScannerReview`, `product_form.html` |

**⚠️ Regla:** Todo `<input>` numérico que reciba entrada del usuario DEBE sanitizar puntos antes de parsear. Nunca `parseFloat(valorCrudo)` sin limpiar.

## Security & Auditing

### Security Headers
Configurados en `next.config.ts` para todas las rutas: CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS (1 año), Referrer-Policy, Permissions-Policy.

### Rate Limiting
- Implementación: `src/lib/rateLimiter.ts` — In-memory sliding window, API compatible con `@upstash/ratelimit`
- Límite: 30 req/min por sesión (usuario) en endpoints sensibles
- Aplicado en: `/api/checkout`, `/api/stats/summary`, `/api/tokens/status`
- Swap a Redis en producción: solo cambiar `new RateLimitStore()` por `new UpstashRateLimitStore()`

### Security Audit Tools
| Tool | Propósito | Cómo ejecutar |
|------|-----------|---------------|
| **k6** | Carga + IDOR | `tests/k6/idor.js` (verifica 401 en accesos no autorizados) |
| **Gitleaks** | Secret scanning | `pnpm audit:secrets` (usa `.gitleaks.toml`) |
| **ZAP** | DAST pasivo | Script en `tests/security/zap-daemon.ps1` (Orderfox) |
| **pnpm audit** | Dependencias | `pnpm audit` — las 19 vulns conocidas son transitivas de Next/Prisma/eslint, no explotables directamente |

### Docker
- `Dockerfile` y `Dockerfile.dev`: usan `USER appuser` (non-root), corrigen DS-0002
- Build: `docker build -t receipt-scanner .`

## Development Workflow

### Commands
```bash
pnpm run dev      # Start dev server (auto hot-reload, no restart needed)
pnpm run build    # Production build verification (generates Prisma client)
pnpm lint         # ESLint check + eslint-plugin-security
```

## Type Safety
All shared types in `src/types/index.ts`. Keep types here, don't scatter across files.
