import { embedText } from '@/lib/embeddings/jina'
import { createAdminClient } from '@/lib/supabase/admin'
import type { QAPair, QAMedia } from '@/types'

// ── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_SIMILARITY_THRESHOLD = 0.75

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
function logUnansweredQuestion(question: string, sessionId?: string): void {
  const admin = createAdminClient()
  admin
    .from('unanswered_questions')
    .insert({ question, session_id: sessionId ?? null })
    .then(({ error }) => {
      if (error) {
        console.error('[matcher] Failed to log unanswered question:', error.message)
      }
    })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Match a user question against admin Q&A pairs using cosine similarity.
 *
 * Steps:
 *   1. Embed the question with Jina (retrieval.query task)
 *   2. Run the match_qa_pair() RPC — threshold check happens inside Postgres
 *   3. If a match is found, fetch the full QAPair row + ordered media
 *   4. If no match, log to unanswered_questions and return { qa: null }
 *
 * @param userQuestion  Raw user input string
 * @param options.sessionId   Chat session UUID — attached to unanswered_questions log
 * @param options.threshold   Override the default similarity threshold (0.75)
 */
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
    console.log(
      `[matcher] no match (threshold=${threshold}): "${userQuestion.slice(0, 80)}"`,
    )
    logUnansweredQuestion(userQuestion, sessionId)
    return { qa: null, score: 0, media: [] }
  }

  // Step 3 — fetch full QAPair row + attached media.
  // The RPC only returns id/question/answer/category/similarity; we need
  // is_active, created_at, updated_at and the media join.
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
