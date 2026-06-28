# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hospital Staff Q&A Assistant** — a Hebrew RTL chatbot for Israeli hospital staff (nurses and doctors).

Admins create Q&A pairs (with optional images/PDFs). When a staff member asks a question, RAG matches it to the closest admin Q&A pair using Jina embeddings + pgvector, then returns the admin's pre-written answer verbatim.

### Critical content rules — never violate these
- **Only return answers from admin-created Q&A pairs.** Never generate, invent, or infer answers.
- **If no matching Q&A is found**, return exactly: `"לא נמצא מידע מאושר בנושא זה. אנא פנה למחלקת משאבי אנוש."`
- **Never hallucinate** medical, HR, or attendance information.

### Features
- User chat screen (Hebrew RTL)
- Admin panel with login
- Admin Q&A management — create, edit, delete
- Optional image/PDF upload per Q&A pair
- RAG matching via Jina embeddings + pgvector
- Statistics dashboard for admin

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (RTL configured) |
| Backend | Next.js Route Handlers |
| Database | Supabase Postgres + pgvector (embeddings) + Supabase Storage (images/PDFs) |
| AI | Jina AI `jina-embeddings-v3` — vector similarity search only, no generative AI |

## IMPORTANT: Read the docs before writing Next.js code

This project uses **Next.js 16**, which has breaking changes not reflected in Claude's training data. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. The docs are organized under `01-app/` (App Router) and `02-pages/` (Pages Router).

## Commands

```bash
npm run dev      # Start dev server (Turbopack, outputs to .next/dev)
npm run build    # Production build (Turbopack by default)
npm run start    # Start production server
npm run lint     # Run ESLint directly (next lint is removed in v16)
npx vitest       # Run unit tests (watch mode)
npx vitest run   # Run unit tests once (CI mode)
npx playwright test            # Run e2e tests (requires dev server or auto-starts it)
npx playwright test e2e/chat.spec.ts   # Run only chat e2e tests
npx playwright test --ui       # Playwright UI mode (interactive)
```

TypeScript type generation for async params/searchParams:
```bash
npx next typegen
```

One-time Playwright browser install (run after cloning):
```bash
npx playwright install chromium
```

## Architecture

Single Next.js App Router application under `src/app/`. Entry points:
- `src/app/layout.tsx` — root layout; **must** have `dir="rtl" lang="he"` on `<html>`
- `src/app/page.tsx` — user-facing chat screen
- `src/app/admin/` — admin panel (login + Q&A management + stats dashboard)
- `src/app/api/` — Route Handlers (chat, embeddings, admin CRUD, file upload)
- `src/app/globals.css` — global styles with Tailwind CSS v4

Path alias: `@/*` → `./src/*`

### RTL / Hebrew
All UI is RTL-first. `dir="rtl" lang="he"` on root `<html>` (never override to LTR). Use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) instead of `ml-`/`mr-`/`pl-`/`pr-`. shadcn/ui supports RTL out of the box when `dir="rtl"` is on the root element.

### RAG pipeline
1. User message → Jina `jina-embeddings-v3` API → embedding vector
2. pgvector similarity search against admin Q&A embeddings in Supabase
3. If similarity above threshold → return the stored admin answer verbatim
4. If below threshold → return the fixed fallback string (see Critical content rules above)

Embeddings are generated server-side in a Route Handler. The Jina API key lives in `JINA_API_KEY` (server-only, no `NEXT_PUBLIC_` prefix).

### Testing

**Unit tests — Vitest**
Test files live alongside the source (`*.test.ts` / `*.test.tsx`). Mock external dependencies (`vi.mock`) — never hit real Supabase or Jina in unit tests.

**E2e tests — Playwright**
Test files live in `e2e/` (`*.spec.ts`). These hit the real app, real Supabase, and real Jina API. Admin tests require `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` in `.env.local`; they skip gracefully when those vars are absent. Playwright auto-starts the dev server if port 3000 is free.

### Folder structure
```
src/
├── app/
│   ├── admin/
│   │   ├── (dashboard)/        # Authenticated admin layout group
│   │   │   ├── layout.tsx
│   │   │   ├── qa/             # Q&A list, new, edit pages
│   │   │   └── stats/          # Statistics dashboard
│   │   ├── login/              # Admin login page
│   │   └── page.tsx            # Admin redirect
│   ├── api/
│   │   ├── admin/              # CRUD routes (qa, media, reembed, debug-match)
│   │   └── chat/               # RAG chat route
│   ├── globals.css
│   ├── layout.tsx              # Root layout — dir="rtl" lang="he"
│   └── page.tsx                # User chat screen
├── components/
│   ├── admin/                  # Admin-only components
│   ├── chat/                   # Chat UI components
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── embeddings/jina.ts      # Jina API client
│   ├── matching/matcher.ts     # RAG similarity + keyword fallback
│   ├── supabase/               # admin / client / server Supabase clients
│   ├── auth.ts                 # getAuthenticatedUser()
│   └── utils.ts                # cn() helper
├── proxy.ts                    # Next.js 16 proxy (was middleware.ts)
└── types/index.ts              # Shared TypeScript types
```

## Code Style

- **Exports**: Named exports for components (`export function Foo`); `export default` only for Next.js pages and layouts
- **Props**: TypeScript `interface` (not `type`) for component props
- **Imports**: Use `import type` for type-only imports
- **Classnames**: Always use `cn()` from `@/lib/utils` for conditional classes
- **Styling**: Tailwind CSS only — no inline styles. RTL-first: use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) not `ml-`/`mr-` etc.
- **Async**: Use `async/await` — avoid `.then()` chains
- **Server vs Client**: Mark client components with `'use client'` at the top. Keep data fetching in Server Components or Route Handlers.

## Rules

- **No `any` types** — use `unknown` or a specific type. Suppress only with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and a comment explaining why.
- **No `console.log`** — use `console.error` only for actual server-side errors in Route Handlers.
- **No unused imports** — remove them; ESLint will flag them.
- **No magic numbers** — extract to named constants.
- **No hallucination** — never generate, infer, or invent Q&A answers. Only return admin-created content.

## Commit Convention

Use **Conventional Commits**:

| Prefix | When to use |
|---|---|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `chore:` | Tooling, config, dependencies, non-code changes |
| `refactor:` | Code restructure with no behavior change |
| `style:` | Formatting, CSS, whitespace |
| `docs:` | Documentation only |
| `perf:` | Performance improvement |
| `test:` | Adding or fixing tests |

Always include the Co-Authored-By trailer when committing with Claude Code.

## Current Focus

TODO: update this each session

## Next.js 16 Breaking Changes

### Async Request APIs (fully removed sync access)
`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are all async. Always `await` them:

```tsx
// Page component
export default async function Page({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const query = await props.searchParams
}

// Route handler
export async function GET(_req: NextRequest, ctx: RouteContext<'/users/[id]'>) {
  const { id } = await ctx.params
}
```

Run `npx next typegen` to generate `PageProps`, `LayoutProps`, and `RouteContext` type helpers.

### fetch() is NOT cached by default
Unlike Next.js 13-15, `fetch()` calls are uncached by default and block rendering. Use `use cache` to cache, or `<Suspense>` to stream:

```tsx
async function getProducts() {
  'use cache'
  cacheLife('hours')
  return await db.query('SELECT * FROM products')
}
```

### Caching APIs
- `cacheLife` and `cacheTag` are stable (drop the `unstable_` prefix)
- `revalidateTag` now requires a second argument: `revalidateTag('posts', 'max')`
- New `updateTag` from `next/cache` for immediate cache expiry (Server Actions only)
- New `refresh` from `next/cache` to refresh the client router from a Server Action

### `middleware` renamed to `proxy`
Rename `middleware.ts` → `proxy.ts` and export `proxy` instead of `middleware`. The edge runtime is not supported in `proxy`; use `middleware` if you need edge.

### `next lint` removed
Use `eslint` directly (`npm run lint`). `next build` no longer runs linting.

### Turbopack is now the default
`next dev` and `next build` use Turbopack. Use `--webpack` flag to opt out. Custom `webpack` config in `next.config.ts` causes build failure unless you explicitly pass `--webpack`.

### Turbopack config moved to top level
```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: { /* options */ }, // was experimental.turbopack
}
```

### Partial Prerendering (PPR)
`experimental.ppr` and `experimental.dynamicIO` / `experimental.useCache` are removed. Use `cacheComponents: true` in `next.config.ts` instead.

### Parallel routes
All parallel route slots require explicit `default.js` files or builds will fail.

### next/image changes
- `images.domains` is deprecated — use `images.remotePatterns`
- Local images with query strings require `images.localPatterns.search` config
- `minimumCacheTTL` default changed to 4 hours (was 60 seconds)
- `next/legacy/image` deprecated — use `next/image`

### Removed APIs
- `serverRuntimeConfig` / `publicRuntimeConfig` — use env vars (`NEXT_PUBLIC_` prefix for client)
- AMP support (`next/amp`, `useAmp`, `config.amp`) fully removed
- `unstable_rootParams` removed

### Dev output directory
`next dev` outputs to `.next/dev` (separate from `.next/` used by `next build`).

### Environment variables
Only `NEXT_PUBLIC_` prefixed vars are included in client bundles. Use `connection()` from `next/server` before reading `process.env` in Server Components when you need runtime (not build-time) values.

## ESLint
Config is in `eslint.config.mjs` (flat config format, required for ESLint v10+). Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
