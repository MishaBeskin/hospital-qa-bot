/**
 * Jina AI embeddings client — jina-embeddings-v3
 *
 * Two public functions:
 *   embedText(text, task?)  → number[]
 *   embedBatch(texts, task?) → number[][]
 *
 * task defaults:
 *   embedText  → 'retrieval.query'   (user questions at query time)
 *   embedBatch → 'retrieval.passage' (admin Q&A pairs at index time)
 *
 * jina-embeddings-v3 is task-aware: always pass the correct task to get
 * the best retrieval quality. Do not mix query and passage embeddings.
 */

// ── Constants ────────────────────────────────────────────────────────────────

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings'
const MODEL = 'jina-embeddings-v3'

/** Must match the vector(1024) column in the database schema. */
export const EMBEDDING_DIMENSIONS = 1024

/**
 * Maximum texts per API request. Jina supports up to 2048 but we keep a
 * conservative limit to avoid hitting payload-size limits.
 */
const MAX_BATCH_SIZE = 128

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1_000

// ── Task type ────────────────────────────────────────────────────────────────

/**
 * jina-embeddings-v3 task types. Choosing the correct task is critical for
 * retrieval quality — the model uses task-specific LoRA adapters.
 *
 * For this project use:
 *   'retrieval.query'   → user question sent to /api/chat
 *   'retrieval.passage' → admin question stored in qa_pairs
 */
export type EmbeddingTask =
  | 'retrieval.query'
  | 'retrieval.passage'
  | 'text-matching'
  | 'classification'
  | 'separation'

// ── Internal types ───────────────────────────────────────────────────────────

interface JinaRequest {
  model: string
  input: string[]
  task: EmbeddingTask
  dimensions: number
  normalized: boolean
}

interface JinaResponse {
  model: string
  data: Array<{ index: number; embedding: number[] }>
  usage: { prompt_tokens: number; total_tokens: number }
}

// ── Custom error ─────────────────────────────────────────────────────────────

export class JinaError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message)
    this.name = 'JinaError'
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireApiKey(): string {
  const key = process.env.JINA_API_KEY
  if (!key) {
    throw new JinaError('JINA_API_KEY environment variable is not set')
  }
  return key
}

/**
 * Normalize text before embedding.
 *
 * NFC normalization is especially important for Hebrew, where characters can
 * be represented as composed or decomposed Unicode sequences. Inconsistent
 * normalization across index and query time would shift embeddings.
 */
function normalizeText(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ')
}

function sleep(ms: number): Promise<void> {
  // Add ±200 ms jitter to avoid a thundering-herd on retries.
  const jitter = (Math.random() - 0.5) * 400
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms + jitter)))
}

function backoffMs(attempt: number): number {
  // 1 s → 2 s → 4 s
  return BASE_DELAY_MS * Math.pow(2, attempt)
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599)
}

// ── Core API call with retry ─────────────────────────────────────────────────

async function callJinaAPI(
  input: string[],
  task: EmbeddingTask,
): Promise<JinaResponse> {
  const apiKey = requireApiKey()

  const body: JinaRequest = {
    model: MODEL,
    input,
    task,
    dimensions: EMBEDDING_DIMENSIONS,
    // Pre-normalize to unit vectors so pgvector cosine distance is exact.
    normalized: true,
  }

  let lastError: Error = new JinaError('Max retries exceeded')

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(backoffMs(attempt - 1))
    }

    let response: Response
    try {
      response = await fetch(JINA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })
    } catch (networkErr) {
      // fetch() itself threw — network failure, DNS, timeout, etc.
      lastError = networkErr instanceof Error ? networkErr : new JinaError(String(networkErr))
      console.warn(`[Jina] Network error on attempt ${attempt + 1}/${MAX_RETRIES + 1}:`, lastError.message)
      continue
    }

    if (response.ok) {
      const data = (await response.json()) as JinaResponse
      console.log(
        `[Jina] model=${data.model} task=${task} texts=${input.length}` +
          ` prompt_tokens=${data.usage.prompt_tokens}` +
          ` total_tokens=${data.usage.total_tokens}`,
      )
      return data
    }

    const responseBody = await response.text()

    if (!isRetryableStatus(response.status)) {
      // 4xx (except 429) — permanent client error, don't retry.
      throw new JinaError(
        `Jina API returned HTTP ${response.status}`,
        response.status,
        responseBody,
      )
    }

    // Retryable server / rate-limit error
    lastError = new JinaError(
      `Jina API returned HTTP ${response.status} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`,
      response.status,
      responseBody,
    )
    console.warn(`[Jina] Retryable error:`, lastError.message)

    // Honour Retry-After header on 429 responses.
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      if (retryAfter) {
        const waitMs = parseFloat(retryAfter) * 1_000
        console.log(`[Jina] Rate limited — waiting ${waitMs} ms (Retry-After header)`)
        await sleep(waitMs)
        continue
      }
    }
  }

  throw lastError
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Embed a single text string.
 *
 * Default task is `retrieval.query` — use this when embedding a user's
 * question at chat time. Pass `retrieval.passage` when embedding admin
 * Q&A questions at write time.
 */
export async function embedText(
  text: string,
  task: EmbeddingTask = 'retrieval.query',
): Promise<number[]> {
  const normalized = normalizeText(text)
  if (!normalized) {
    throw new JinaError('embedText: text is empty after normalization')
  }

  const response = await callJinaAPI([normalized], task)
  const item = response.data[0]

  if (!item?.embedding?.length) {
    throw new JinaError('Jina API returned an empty embedding')
  }

  return item.embedding
}

/**
 * Embed multiple texts in the fewest API calls possible.
 *
 * Default task is `retrieval.passage` — use this when indexing admin Q&A
 * questions. Pass `retrieval.query` if embedding a batch of user queries.
 *
 * Input order is preserved in the output regardless of API response order.
 * Large batches are split into chunks of MAX_BATCH_SIZE automatically.
 */
export async function embedBatch(
  texts: string[],
  task: EmbeddingTask = 'retrieval.passage',
): Promise<number[][]> {
  if (!texts.length) return []

  const normalized = texts.map(normalizeText)

  const emptyIndex = normalized.findIndex((t) => !t)
  if (emptyIndex !== -1) {
    throw new JinaError(
      `embedBatch: text at index ${emptyIndex} is empty after normalization`,
    )
  }

  // Split into chunks to stay under the per-request limit.
  const chunks: string[][] = []
  for (let i = 0; i < normalized.length; i += MAX_BATCH_SIZE) {
    chunks.push(normalized.slice(i, i + MAX_BATCH_SIZE))
  }

  // Process chunks sequentially to avoid flooding the API.
  const allEmbeddings: number[][] = []
  for (const chunk of chunks) {
    const response = await callJinaAPI(chunk, task)

    // Sort by index to guarantee input order is preserved.
    const sorted = [...response.data].sort((a, b) => a.index - b.index)
    for (const item of sorted) {
      if (!item.embedding?.length) {
        throw new JinaError(`Jina API returned an empty embedding in batch at index ${item.index}`)
      }
      allEmbeddings.push(item.embedding)
    }
  }

  return allEmbeddings
}
