# Receipt-Scanner-AI Agent Guidelines

## Project Overview
Receipt-Scanner-AI is an intelligent expense tracker that automatically scans receipt images, extracts data using OCR + AI, and categorizes expenses. Users have token-based credits for AI processing with different subscription tiers.

**Tech Stack**: Next.js 15 (App Router) • React 19 • TypeScript • Prisma • MariaDB • Clerk Auth • Google Vision + DeepSeek AI

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
            ↔ ai_token_transactions (transaction log: "spend", "refund", "purchase")
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
Users have a wallet: `plan_tokens` (subscription) + `extra_tokens` (purchased) per month with `reset_at` date.

### Receipt Processing Pipeline
1. **User uploads image** → Base64 encoded, sent to server action
2. **Check token balance** → Deduct ~1 token per scan
3. **Google Vision API** → Extract raw text (30-sec timeout, base64 input)
4. **Structured extraction** → DeepSeek API (cost: ~0.5 tokens) extracts: amount, merchant, date, category, items array
5. **Confidence scoring**:
   - `amountConfidence` (0.7-1.0): Higher if line-item sum matches total
   - `itemsConfidence` (0.5-1.0): Higher if receipt structure is clear
6. **Save expense** → Store with OCR data + confidence scores; `revalidatePath()` to update UI
7. **Failure handling** → Refund tokens if processing fails

See [src/actions/ocr.ts](src/actions/ocr.ts) and [src/actions/services/aiStructuring.ts](src/actions/services/aiStructuring.ts) for implementation.

## Development Workflow

### Commands
```bash
pnpm run dev      # Start dev server (auto hot-reload, no restart needed)
pnpm run build    # Production build verification (generates Prisma client)
pnpm lint         # ESLint check
```

### Important Notes
- **No need to restart dev server** for code changes (Next.js handles hot reload)
- **Run build sparingly**: Only to verify no errors before deployment
- **Never use `next build`** multiple times during development
- **Prisma migrations**: When schema changes, run: `npx prisma migrate dev`

## Common Tasks & Patterns

### Adding a New Expense Field
1. Update Prisma schema (`prisma/schema.prisma`)
2. Run migration: `npx prisma migrate dev --name add_field_name`
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
- **Deduct atomically**: Create transaction record + update wallet in same action
- **Implement refunds on failure**: If OCR fails, refund the token immediately
- See `tokenService.ts` for token utility functions

## Code Organization
- `src/actions/` → Server action business logic (expenses, categories, auth)
- `src/actions/services/` → External API integrations (AI, OCR, token management)
- `src/app/` → Next.js pages and layouts (dashboard, auth routes, API webhooks)
- `src/components/` → React components (scanner, charts, forms, modals)
- `src/lib/` → Utility modules (Prisma client, Cloudinary, OpenAI client)
- `src/types/` → Shared TypeScript interfaces
- `prisma/` → Prisma schema + migrations

## Key Files to Know
- **[prisma/schema.prisma](prisma/schema.prisma)** → Complete data model
- **[src/actions/ocr.ts](src/actions/ocr.ts)** → Receipt scanning entry point
- **[src/actions/services/aiStructuring.ts](src/actions/services/aiStructuring.ts)** → AI extraction logic
- **[src/middleware.ts](src/middleware.ts)** → Auth & route protection
- **[src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)** → Main dashboard view

## Potential Pitfalls
- **Forgetting `revalidatePath()`** after mutations → stale UI data
- **Not checking token balance** before processing → failed operations
- **Mixing old/new schema tables** → confusion with restaurant vs user data
- **Missing `'use server'` directive** → client-side code in server actions
- **Not validating userId** → security vulnerability
- **OCR timeout (30s)** → handle large base64 images that exceed timeout

## Type Safety
All shared types in `src/types/index.ts`. Keep types here, don't scatter across files.
