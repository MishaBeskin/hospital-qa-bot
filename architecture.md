# Architecture — Hospital Staff Q&A Assistant

## Core principle

RAG is used exclusively to **match** a user question to an existing admin Q&A pair. No answer is ever generated. If the similarity score is below the threshold, the system returns the fixed fallback string and nothing else.

---

## 1. Folder Structure

```
hospital-qa-bot/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout — dir="rtl" lang="he" on <html>
│   │   ├── globals.css
│   │   ├── page.tsx                     # User chat screen
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx               # Admin shell — sidebar + auth guard
│   │   │   ├── page.tsx                 # Redirect → /admin/qa
│   │   │   ├── login/
│   │   │   │   └── page.tsx             # Login form
│   │   │   ├── qa/
│   │   │   │   ├── page.tsx             # Q&A list (paginated, searchable)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx         # Create Q&A pair
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Edit Q&A pair
│   │   │   └── stats/
│   │   │       └── page.tsx             # Statistics dashboard
│   │   │
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts             # POST — embed question, match, return answer
│   │       └── admin/
│   │           ├── qa/
│   │           │   ├── route.ts         # GET list, POST create (triggers embedding)
│   │           │   └── [id]/
│   │           │       ├── route.ts     # GET, PUT (re-embeds if question changed), DELETE
│   │           │       └── attachments/
│   │           │           └── route.ts # POST upload file to Supabase Storage
│   │           ├── attachments/
│   │           │   └── [id]/
│   │           │       └── route.ts     # DELETE — remove file + Storage object
│   │           └── stats/
│   │               └── route.ts         # GET — aggregated chat metrics
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui primitives (Button, Input, etc.)
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx           # Scrollable message list + input bar
│   │   │   ├── MessageBubble.tsx        # User / assistant bubble (RTL layout)
│   │   │   ├── MessageInput.tsx         # Textarea + send button
│   │   │   └── InlineAttachments.tsx    # Renders images inline, PDF download links
│   │   └── admin/
│   │       ├── AdminSidebar.tsx         # Nav links (Q&A, Stats, Logout)
│   │       ├── QAForm.tsx               # Create/edit form — question, answer, attachments
│   │       ├── QAList.tsx               # Paginated table with search
│   │       ├── AttachmentUpload.tsx     # Drag-drop / file input, shows preview
│   │       ├── AttachmentPreview.tsx    # Thumbnail for image, icon for PDF
│   │       └── StatsCards.tsx           # Metric cards + charts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # createBrowserClient() — for Client Components
│   │   │   ├── server.ts               # createServerClient() — for Server Components / Route Handlers
│   │   │   └── db.types.ts             # Generated types (via supabase gen types)
│   │   ├── jina.ts                     # embedText(text) → number[]
│   │   ├── rag.ts                      # matchQuestion(question) → MatchResult | null
│   │   └── constants.ts                # SIMILARITY_THRESHOLD, FALLBACK_MESSAGE, etc.
│   │
│   ├── types/
│   │   └── index.ts                    # Domain types (QAPair, Attachment, ChatMessage, …)
│   │
│   └── hooks/
│       ├── useChat.ts                  # Chat state — messages, sending, optimistic updates
│       └── useQAForm.ts                # Q&A form state — validation, file queue, submit
│
├── proxy.ts                             # Auth guard for /admin/** routes (Next.js 16 "middleware")
├── architecture.md                      # This file
├── CLAUDE.md
└── supabase/
    └── migrations/                      # SQL migration files
```

---

## 2. Domain Model

### QAPair
The central entity. Represents a single admin-authored question + answer.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `question` | `string` | The representative question, in Hebrew |
| `answer` | `string` | Pre-written answer, in Hebrew. Never modified by AI. |
| `category` | `string \| null` | Optional grouping label (e.g. "חופשות", "שכר") |
| `question_embedding` | `number[]` | 1024-dim vector from `jina-embeddings-v3` |
| `is_active` | `boolean` | Soft-disable without deleting |
| `created_by` | `uuid` | Supabase `auth.users` FK |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### Attachment
Files attached to a Q&A pair, shown inline in the answer.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `qa_pair_id` | `uuid` | FK → `qa_pairs`, CASCADE DELETE |
| `file_type` | `'image' \| 'pdf'` | |
| `storage_path` | `string` | Path within Supabase Storage bucket `qa-attachments` |
| `file_name` | `string` | Original filename shown to users |
| `file_size` | `number` | Bytes |
| `sort_order` | `number` | Display order within the answer |
| `created_at` | `timestamptz` | |

### ChatSession
Groups messages from one browser session for analytics.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `created_at` | `timestamptz` | |
| `last_activity` | `timestamptz` | Updated on each message |

### ChatMessage
One user question and its resolution. Drives statistics.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `session_id` | `uuid` | FK → `chat_sessions` |
| `user_message` | `string` | Raw user input |
| `matched_qa_id` | `uuid \| null` | FK → `qa_pairs` — null if no match |
| `similarity_score` | `number \| null` | Cosine similarity of top candidate |
| `was_matched` | `boolean` | `true` if score ≥ threshold |
| `created_at` | `timestamptz` | |

---

## 3. Database Schema

```sql
-- Enable pgvector
create extension if not exists vector;

-- Q&A pairs
create table qa_pairs (
  id              uuid primary key default gen_random_uuid(),
  question        text not null,
  answer          text not null,
  category        text,
  question_embedding vector(1024),          -- jina-embeddings-v3 output dimension
  is_active       boolean not null default true,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- HNSW index for fast cosine similarity search
create index qa_pairs_embedding_idx
  on qa_pairs
  using hnsw (question_embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Attachments
create table attachments (
  id              uuid primary key default gen_random_uuid(),
  qa_pair_id      uuid not null references qa_pairs(id) on delete cascade,
  file_type       text not null check (file_type in ('image', 'pdf')),
  storage_path    text not null,
  file_name       text not null,
  file_size       integer not null,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index attachments_qa_pair_idx on attachments(qa_pair_id);

-- Chat sessions
create table chat_sessions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  last_activity   timestamptz not null default now()
);

-- Chat messages (analytics only — no PII stored)
create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references chat_sessions(id) on delete cascade,
  user_message    text not null,
  matched_qa_id   uuid references qa_pairs(id) on delete set null,
  similarity_score numeric(5, 4),
  was_matched     boolean not null,
  created_at      timestamptz not null default now()
);

create index chat_messages_created_at_idx on chat_messages(created_at);
create index chat_messages_matched_qa_idx on chat_messages(matched_qa_id);

-- Similarity search function (called from Route Handler)
create or replace function match_qa_pair(
  query_embedding vector(1024),
  match_threshold float,
  match_count     int default 1
)
returns table (
  id              uuid,
  question        text,
  answer          text,
  category        text,
  similarity      float
)
language sql stable
as $$
  select
    qa_pairs.id,
    qa_pairs.question,
    qa_pairs.answer,
    qa_pairs.category,
    1 - (qa_pairs.question_embedding <=> query_embedding) as similarity
  from qa_pairs
  where
    is_active = true
    and question_embedding is not null
    and 1 - (qa_pairs.question_embedding <=> query_embedding) >= match_threshold
  order by qa_pairs.question_embedding <=> query_embedding
  limit match_count;
$$;
```

### Supabase Storage

Bucket: `qa-attachments` (private, access via signed URLs or RLS policies)

Storage path convention: `{qa_pair_id}/{attachment_id}.{ext}`

---

## 4. RAG Architecture

This system does **retrieval only** — no generation.

```
User types question
        │
        ▼
POST /api/chat
        │
        ├─ 1. Embed user question
        │      → Jina API: POST https://api.jina.ai/v1/embeddings
        │        model: jina-embeddings-v3
        │        input: [user_message]
        │        → vector[1024]
        │
        ├─ 2. Vector similarity search
        │      → Supabase RPC: match_qa_pair(embedding, threshold=0.75, count=1)
        │        uses HNSW cosine distance on qa_pairs.question_embedding
        │
        ├─ 3a. Match found (similarity ≥ 0.75)
        │      → Return qa_pair.answer (verbatim)
        │      → Return qa_pair.attachments (sorted by sort_order)
        │      → Log to chat_messages (was_matched=true)
        │
        └─ 3b. No match (similarity < 0.75 or no results)
               → Return FALLBACK_MESSAGE (hardcoded Hebrew string)
               → Log to chat_messages (was_matched=false, matched_qa_id=null)
```

### Embedding on write

When an admin creates or edits a Q&A pair:

```
Admin saves Q&A
        │
        ▼
POST /api/admin/qa  (or PUT /api/admin/qa/[id])
        │
        ├─ 1. Validate input (question, answer required)
        ├─ 2. Embed the question text via Jina API
        ├─ 3. INSERT / UPDATE qa_pairs row (with embedding)
        └─ 4. Handle attachments (see §6)
```

The embedding is always computed server-side. The Jina API key is never exposed to the client.

### Constants (`src/lib/constants.ts`)

```
SIMILARITY_THRESHOLD = 0.75
EMBEDDING_DIMENSIONS = 1024
EMBEDDING_MODEL      = "jina-embeddings-v3"
FALLBACK_MESSAGE     = "לא נמצא מידע מאושר בנושא זה. אנא פנה למחלקת משאבי אנוש."
MAX_ATTACHMENT_SIZE  = 10_485_760  (10 MB)
ALLOWED_FILE_TYPES   = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
```

---

## 5. API Routes

All admin routes require a valid Supabase session (enforced in `proxy.ts` and re-validated in each Route Handler).

### Chat (public)

| Method | Path | Body | Response |
|---|---|---|---|
| `POST` | `/api/chat` | `{ session_id, message }` | `{ answer, attachments[], was_matched, qa_id? }` |

### Admin — Q&A management

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/qa` | Query params: `page`, `limit`, `search`, `category`, `active` |
| `POST` | `/api/admin/qa` | Body: `{ question, answer, category? }` — triggers Jina embedding |
| `GET` | `/api/admin/qa/[id]` | Returns Q&A pair with its attachments |
| `PUT` | `/api/admin/qa/[id]` | Re-embeds only if `question` changed |
| `DELETE` | `/api/admin/qa/[id]` | Cascades to attachments; deletes Storage objects |

### Admin — Attachments

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/admin/qa/[id]/attachments` | `multipart/form-data`; uploads to Supabase Storage, inserts `attachments` row |
| `DELETE` | `/api/admin/attachments/[id]` | Deletes Storage object + `attachments` row |

### Admin — Statistics

| Method | Path | Response |
|---|---|---|
| `GET` | `/api/admin/stats` | `{ total_messages, match_rate, daily_counts[], top_matched_qa[], unmatched_messages[] }` |

---

## 6. Admin Panel Architecture

### Auth flow

- Supabase email/password authentication.
- `proxy.ts` (Next.js 16's renamed middleware) intercepts all `/admin/**` requests. Reads the Supabase session cookie; redirects to `/admin/login` if missing or expired.
- Login page calls Supabase `signInWithPassword` on the client; on success, Next.js navigation takes over.
- Route Handlers additionally re-validate the session server-side (defense in depth).

### Pages

#### `/admin/login`
- Email + password form (shadcn `Input`, `Button`)
- Error message on invalid credentials
- On success → redirect to `/admin/qa`

#### `/admin/qa` — Q&A List
- Server Component fetches paginated Q&A pairs from Supabase
- Client-side search input filters by question text
- Filter by category and active/inactive status
- Table rows: question preview, category, active toggle, edit/delete actions
- "New Q&A" button → `/admin/qa/new`

#### `/admin/qa/new` and `/admin/qa/[id]` — Q&A Form
State managed by `useQAForm` hook. Single form for both create and edit.

Fields:
- **Question** (textarea, required) — the representative question in Hebrew
- **Answer** (textarea, required) — verbatim answer in Hebrew; supports line breaks
- **Category** (text input, optional)
- **Active** (toggle)
- **Attachments** — `AttachmentUpload` component:
  - Drag-drop zone or file picker
  - Accepted types: JPEG, PNG, WebP, PDF (≤ 10 MB each)
  - Shows thumbnail previews for images; PDF icon for PDFs
  - Reorder via sort_order (drag handles)
  - Delete individual attachments (calls DELETE route immediately)

On submit:
1. POST/PUT the Q&A pair (embedding happens server-side)
2. Upload any queued new attachment files via `POST /api/admin/qa/[id]/attachments`
3. Redirect to list on success

#### `/admin/stats` — Statistics Dashboard
Metrics displayed:
- Total questions today / this week / all time
- Match rate % (matched vs fallback)
- Daily question volume chart (last 30 days)
- Top 10 most-queried Q&A pairs
- Recent unmatched questions (to guide new Q&A creation)

---

## 7. Data Flow Diagrams

### User Chat Request

```
Browser (chat page)
  │  POST /api/chat { session_id, message }
  ▼
Route Handler (server)
  │  embed(message) ──────────────────────► Jina API
  │  ◄──────────────────────────────────── vector[1024]
  │
  │  match_qa_pair(vector, 0.75) ─────────► Supabase (pgvector)
  │  ◄──────────────────────────────────── { answer, id, similarity } | null
  │
  │  log to chat_messages ────────────────► Supabase
  │
  └─ return { answer | FALLBACK, attachments }
         │
         ▼
      Browser renders MessageBubble with answer text + InlineAttachments
```

### Admin Creates Q&A

```
Admin fills form → submit
  │  POST /api/admin/qa { question, answer, category }
  ▼
Route Handler (server)
  │  verify session ──────────────────────► Supabase Auth
  │  embed(question) ─────────────────────► Jina API
  │  ◄──────────────────────────────────── vector[1024]
  │  INSERT qa_pairs (with embedding) ────► Supabase Postgres
  │  ◄──────────────────────────────────── { id }
  └─ return { id }
         │
Admin uploads files (per attachment)
  │  POST /api/admin/qa/[id]/attachments (multipart)
  ▼
Route Handler
  │  upload file ─────────────────────────► Supabase Storage
  │  INSERT attachments row ──────────────► Supabase Postgres
  └─ return { attachment }
```

---

## 8. Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Embedding only questions, not answers | Questions | Users ask questions; matching against question text gives tighter semantic alignment |
| HNSW index over IVFFlat | HNSW | Better recall at query time; no need to pre-tune `lists` parameter; suitable for datasets up to millions of rows |
| Similarity threshold 0.75 | Configurable constant | Tunable without code changes; start conservative to avoid wrong answers |
| No answer generation | Hard constraint | Medical/HR domain — wrong answers are harmful; all answers pre-approved by admin |
| Attachments in Storage, path in DB | Supabase Storage | Keeps DB rows small; Storage handles CDN and signed URLs |
| `proxy.ts` for auth guard | Next.js 16 proxy | Replaces `middleware.ts` in v16; runs before page rendering |
| `chat_messages` logs raw user text | Yes | Needed for stats on unmatched questions; no personal identifiers stored |
| Supabase RPC for similarity search | `match_qa_pair` function | Encapsulates threshold logic in DB; avoids fetching all embeddings into Node |
