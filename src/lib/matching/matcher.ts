import { embedText } from '@/lib/embeddings/jina'
import { createAdminClient } from '@/lib/supabase/admin'
import type { QAPair, QAMedia } from '@/types'

// ── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_SIMILARITY_THRESHOLD =
  Number(process.env.SIMILARITY_THRESHOLD) || 0.65

// ── Types ────────────────────────────────────────────────────────────────────

export interface MatchResult {
  qa: QAPair | null
  score: number
  media: QAMedia[]
}

// Columns returned by the match_qa_pair() Postgres RPC.
// Does not include is_active, created_at, updated_at — those require a second fetch.
interface RpcRow {
  id: string
  question: string
  answer: string
  category: string | null
  similarity: number
}

// ── Internal helpers ─────────────────────────────────────────────────────────

// Fire-and-forget: insert into unanswered_questions without blocking the response.
// Skips the insert when an identical (case-insensitive, whitespace-normalised) question
// already exists so the table stays deduplicated over time.
function logUnansweredQuestion(question: string, sessionId?: string): void {
  const admin = createAdminClient()
  const normalized = question.trim().replace(/\s+/g, ' ')

  ;(async () => {
    const { data } = await admin
      .from('unanswered_questions')
      .select('id')
      .ilike('question', normalized)
      .limit(1)

    if (data?.length) return

    const { error } = await admin
      .from('unanswered_questions')
      .insert({ question: normalized, session_id: sessionId ?? null })

    if (error) {
      console.error('[matcher] Failed to log unanswered question:', error.message)
    }
  })()
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&')
}

// Keyword fallback: splits the query into words and requires each to appear
// in either the question or answer text (AND across words, OR across fields).
async function keywordFallback(
  userQuestion: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ qa: QAPair; media: QAMedia[] } | null> {
  const words = userQuestion
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^א-תa-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 1)
  if (!words.length) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from('qa_pairs')
    .select('id, question, answer, category, is_active, created_at, updated_at, qa_media(*)')
    .eq('is_active', true)
    .limit(1)

  for (const word of words) {
    query = query.or(`question.ilike.%${escapeLike(word)}%,answer.ilike.%${escapeLike(word)}%`)
  }

  const { data, error } = await query
  if (error || !data?.length) return null

  const row = data[0]
  const media: QAMedia[] = (row.qa_media as QAMedia[]).sort(
    (a, b) => a.display_order - b.display_order,
  )

  const qa: QAPair = {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  return { qa, media }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function matchQuestion(
  userQuestion: string,
  options?: {
    sessionId?: string
    threshold?: number
  },
): Promise<MatchResult> {
  const threshold = options?.threshold ?? DEFAULT_SIMILARITY_THRESHOLD
  const sessionId = options?.sessionId

  // Step 1 — embed the user question
  const embedding = await embedText(userQuestion, 'retrieval.query')

  // Step 2 — cosine similarity search via pgvector RPC
  const admin = createAdminClient()
  const { data, error: rpcError } = await admin.rpc('match_qa_pair', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: 1,
  })

  if (rpcError) {
    throw new Error(`[matcher] Similarity search failed: ${rpcError.message}`)
  }

  const top: RpcRow | null = (data as RpcRow[] | null)?.[0] ?? null

  if (!top) {
    // Log best available score for diagnostics
    const { data: debugData } = await admin.rpc('match_qa_pair', {
      query_embedding: embedding,
      match_threshold: 0,
      match_count: 1,
    })
    const best = (debugData as RpcRow[] | null)?.[0]
    console.log(
      `[matcher] no vector match (threshold=${threshold}, best=${best ? best.similarity.toFixed(4) : 'none'}): "${userQuestion.slice(0, 80)}"`,
    )

    // Step 3 — keyword fallback
    const keyword = await keywordFallback(userQuestion, admin)
    if (keyword) {
      console.log(`[matcher] keyword fallback matched: "${userQuestion.slice(0, 60)}"`)
      return { qa: keyword.qa, score: 0, media: keyword.media }
    }

    logUnansweredQuestion(userQuestion, sessionId)
    return { qa: null, score: 0, media: [] }
  }

  // Step 4 — fetch full QAPair row + attached media
  const { data: pair, error: fetchError } = await admin
    .from('qa_pairs')
    .select('id, question, answer, category, is_active, created_at, updated_at, qa_media(*)')
    .eq('id', top.id)
    .single()

  if (fetchError || !pair) {
    throw new Error(
      `[matcher] Failed to fetch matched Q&A pair: ${fetchError?.message ?? 'not found'}`,
    )
  }

  const media: QAMedia[] = (pair.qa_media as QAMedia[]).sort(
    (a, b) => a.display_order - b.display_order,
  )

  const qa: QAPair = {
    id: pair.id,
    question: pair.question,
    answer: pair.answer,
    category: pair.category,
    is_active: pair.is_active,
    created_at: pair.created_at,
    updated_at: pair.updated_at,
  }

  console.log(
    `[matcher] matched id=${qa.id} score=${top.similarity.toFixed(4)}: "${userQuestion.slice(0, 60)}"`,
  )

  return { qa, score: top.similarity, media }
}
