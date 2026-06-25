-- ============================================================
-- Enums
-- ============================================================

create type media_file_type as enum ('image', 'pdf');
create type chat_role as enum ('user', 'assistant');


-- ============================================================
-- Tables
-- ============================================================

-- Admin-created Q&A pairs with Jina embeddings
create table qa_pairs (
  id          uuid        primary key default gen_random_uuid(),
  question    text        not null,
  answer      text        not null,
  embedding   vector(1024),                            -- jina-embeddings-v3 (1024 dims)
  category    text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Media files (images / PDFs) attached to a Q&A pair,
-- displayed inline in the answer
create table qa_media (
  id            uuid           primary key default gen_random_uuid(),
  qa_pair_id    uuid           not null references qa_pairs(id) on delete cascade,
  file_url      text           not null,               -- Supabase Storage public/signed URL
  file_type     media_file_type not null,
  display_order integer        not null default 0,
  created_at    timestamptz    not null default now()
);

-- Anonymous browser sessions for grouping messages
create table chat_sessions (
  id              uuid        primary key default gen_random_uuid(),
  user_identifier text,                                -- optional, never PII
  created_at      timestamptz not null default now()
);

-- Every turn in a conversation (both user and assistant)
create table chat_messages (
  id               uuid        primary key default gen_random_uuid(),
  session_id       uuid        not null references chat_sessions(id) on delete cascade,
  role             chat_role   not null,
  content          text        not null,
  matched_qa_id    uuid        references qa_pairs(id) on delete set null,
  similarity_score real,                               -- cosine similarity [0, 1], null when role = 'user'
  created_at       timestamptz not null default now()
);

-- Questions that fell below the similarity threshold (no match found).
-- Populated automatically by the chat Route Handler for admin review.
create table unanswered_questions (
  id         uuid        primary key default gen_random_uuid(),
  question   text        not null,
  session_id uuid        references chat_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);


-- ============================================================
-- Indexes
-- ============================================================

-- HNSW index on embeddings for fast cosine similarity search.
-- m=16 (connections per node), ef_construction=64 (build quality).
-- These defaults suit datasets up to ~100k rows; tune upward if needed.
create index qa_pairs_embedding_idx
  on qa_pairs
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Speed up foreign-key lookups and cascade deletes
create index qa_media_qa_pair_id_idx       on qa_media(qa_pair_id);
create index chat_messages_session_id_idx  on chat_messages(session_id);
create index unanswered_questions_session_idx on unanswered_questions(session_id);

-- Stats queries filter / group by time
create index chat_messages_created_at_idx       on chat_messages(created_at);
create index unanswered_questions_created_at_idx on unanswered_questions(created_at);

-- Stats: most-queried Q&A pairs
create index chat_messages_matched_qa_id_idx on chat_messages(matched_qa_id)
  where matched_qa_id is not null;


-- ============================================================
-- updated_at trigger for qa_pairs
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger qa_pairs_updated_at
  before update on qa_pairs
  for each row
  execute function set_updated_at();


-- ============================================================
-- Similarity search function
-- ============================================================
--
-- Called from the /api/chat Route Handler.
-- Performs the threshold check inside Postgres so that
-- no embedding vectors are transferred to Node.js.
--
-- Usage:
--   select * from match_qa_pair(
--     query_embedding := '<vector>',
--     match_threshold := 0.75,
--     match_count     := 1
--   );

create or replace function match_qa_pair(
  query_embedding vector(1024),
  match_threshold float    default 0.75,
  match_count     int      default 1
)
returns table (
  id               uuid,
  question         text,
  answer           text,
  category         text,
  similarity       float
)
language sql stable
as $$
  select
    q.id,
    q.question,
    q.answer,
    q.category,
    -- pgvector <=> is cosine distance (0 = identical, 2 = opposite)
    -- similarity = 1 - distance, giving a [0, 1] score
    (1 - (q.embedding <=> query_embedding))::float as similarity
  from qa_pairs q
  where
    q.is_active   = true
    and q.embedding is not null
    and (1 - (q.embedding <=> query_embedding)) >= match_threshold
  order by q.embedding <=> query_embedding asc   -- nearest first
  limit match_count;
$$;


-- ============================================================
-- Row-Level Security
-- ============================================================
--
-- All server-side Route Handlers use the service role key,
-- which bypasses RLS.  RLS acts as a safety net against
-- accidental direct client access.

alter table qa_pairs           enable row level security;
alter table qa_media           enable row level security;
alter table chat_sessions      enable row level security;
alter table chat_messages      enable row level security;
alter table unanswered_questions enable row level security;

-- qa_pairs: anyone can read active pairs (needed for the similarity function);
-- only service role can write.
create policy "qa_pairs: public read active"
  on qa_pairs for select
  using (is_active = true);

-- qa_media: public read mirrors qa_pairs access
create policy "qa_media: public read"
  on qa_media for select
  using (
    exists (
      select 1 from qa_pairs qp
      where qp.id = qa_media.qa_pair_id
        and qp.is_active = true
    )
  );

-- chat_sessions: anyone can insert their own session
create policy "chat_sessions: insert"
  on chat_sessions for insert
  with check (true);

-- chat_messages: anyone can insert; no direct client reads
create policy "chat_messages: insert"
  on chat_messages for insert
  with check (true);

-- unanswered_questions: server inserts only; no client reads
create policy "unanswered_questions: insert"
  on unanswered_questions for insert
  with check (true);
