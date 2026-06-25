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
npx vitest       # Run unit tests
npx vitest run   # Run unit tests once (CI mode)
```

TypeScript type generation for async params/searchParams:
```bash
npx next typegen
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
Unit tests use **Vitest** only — no integration or e2e tests. Test files live alongside the code they test (`*.test.ts` / `*.test.tsx`).

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
