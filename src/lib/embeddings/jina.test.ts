import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { embedText, embedBatch, JinaError, EMBEDDING_DIMENSIONS } from './jina'

const MOCK_EMBEDDING = Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => i / EMBEDDING_DIMENSIONS)

function makeOkResponse(embeddings: number[][], startIndex = 0) {
  return {
    ok: true,
    json: async () => ({
      model: 'jina-embeddings-v3',
      data: embeddings.map((embedding, i) => ({ index: startIndex + i, embedding })),
      usage: { prompt_tokens: 10, total_tokens: 10 },
    }),
  }
}

function makeErrorResponse(status: number, body = 'Error') {
  return {
    ok: false,
    status,
    text: async () => body,
    headers: { get: () => null },
  }
}

beforeEach(() => {
  process.env.JINA_API_KEY = 'test-key'
  vi.useFakeTimers()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  delete process.env.JINA_API_KEY
})

// ── embedText ────────────────────────────────────────────────────────────────

describe('embedText', () => {
  it('returns a number[] on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeOkResponse([MOCK_EMBEDDING])))
    const result = await embedText('שלום עולם')
    expect(result).toEqual(MOCK_EMBEDDING)
  })

  it('passes the correct task to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse([MOCK_EMBEDDING]))
    vi.stubGlobal('fetch', fetchMock)
    await embedText('hello', 'retrieval.passage')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.task).toBe('retrieval.passage')
  })

  it('defaults to retrieval.query task', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse([MOCK_EMBEDDING]))
    vi.stubGlobal('fetch', fetchMock)
    await embedText('hello')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.task).toBe('retrieval.query')
  })

  it('normalizes Hebrew text before sending (NFC, collapse whitespace)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse([MOCK_EMBEDDING]))
    vi.stubGlobal('fetch', fetchMock)
    await embedText('  שלום   עולם  ')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.input).toEqual(['שלום עולם'])
  })

  it('throws JinaError when text is empty after normalization', async () => {
    vi.stubGlobal('fetch', vi.fn())
    await expect(embedText('   ')).rejects.toThrow(JinaError)
    await expect(embedText('')).rejects.toThrow('empty after normalization')
  })

  it('throws JinaError immediately on 400 (no retry)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeErrorResponse(400, 'Bad Request'))
    vi.stubGlobal('fetch', fetchMock)
    // Attach rejection handler before yielding to microtask queue
    await expect(embedText('hello')).rejects.toThrow(JinaError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws JinaError immediately on 401 (no retry)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeErrorResponse(401))
    vi.stubGlobal('fetch', fetchMock)
    await expect(embedText('hello')).rejects.toThrow('HTTP 401')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 and succeeds on second attempt', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeErrorResponse(500, 'Server Error'))
      .mockResolvedValue(makeOkResponse([MOCK_EMBEDDING]))
    vi.stubGlobal('fetch', fetchMock)
    const promise = embedText('hello')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual(MOCK_EMBEDDING)
  })

  it('retries on 429 and succeeds on second attempt', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeErrorResponse(429, 'Rate limited'))
      .mockResolvedValue(makeOkResponse([MOCK_EMBEDDING]))
    vi.stubGlobal('fetch', fetchMock)
    const promise = embedText('hello')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual(MOCK_EMBEDDING)
  })

  it('throws after exhausting all retries on persistent 500', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeErrorResponse(500, 'Server Error'))
    vi.stubGlobal('fetch', fetchMock)
    // Attach rejection handler first, then run timers, to avoid unhandled rejection
    const assertion = expect(embedText('hello')).rejects.toThrow(JinaError)
    await vi.runAllTimersAsync()
    await assertion
    // 1 initial + 3 retries = 4 total attempts
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('retries on network failure then succeeds', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(makeOkResponse([MOCK_EMBEDDING]))
    vi.stubGlobal('fetch', fetchMock)
    const promise = embedText('hello')
    await vi.runAllTimersAsync()
    const result = await promise
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual(MOCK_EMBEDDING)
  })

  it('throws JinaError when API returns empty embedding', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: 'jina-embeddings-v3',
        data: [{ index: 0, embedding: [] }],
        usage: { prompt_tokens: 1, total_tokens: 1 },
      }),
    }))
    await expect(embedText('hello')).rejects.toThrow('empty embedding')
  })

  it('throws JinaError when JINA_API_KEY is missing', async () => {
    delete process.env.JINA_API_KEY
    vi.stubGlobal('fetch', vi.fn())
    await expect(embedText('hello')).rejects.toThrow('JINA_API_KEY')
  })
})

// ── embedBatch ───────────────────────────────────────────────────────────────

describe('embedBatch', () => {
  it('returns [] for empty input without calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await embedBatch([])
    expect(result).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns embeddings in input order', async () => {
    const emb1 = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 1)
    const emb2 = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 2)
    // API returns them reversed to test ordering
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: 'jina-embeddings-v3',
        data: [
          { index: 1, embedding: emb2 },
          { index: 0, embedding: emb1 },
        ],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      }),
    }))
    const result = await embedBatch(['first', 'second'])
    expect(result[0]).toEqual(emb1)
    expect(result[1]).toEqual(emb2)
  })

  it('defaults to retrieval.passage task', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse([MOCK_EMBEDDING]))
    vi.stubGlobal('fetch', fetchMock)
    await embedBatch(['hello'])
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.task).toBe('retrieval.passage')
  })

  it('throws JinaError when any text is empty after normalization', async () => {
    vi.stubGlobal('fetch', vi.fn())
    await expect(embedBatch(['valid', '   ', 'also valid'])).rejects.toThrow(
      'text at index 1 is empty',
    )
  })

  it('splits large batches into chunks of 128', async () => {
    const texts = Array.from({ length: 130 }, (_, i) => `text-${i}`)
    const emb = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0.5)

    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, opts) => {
      const body = JSON.parse(opts.body) as { input: string[] }
      const startIndex = callCount * 128
      callCount++
      return {
        ok: true,
        json: async () => ({
          model: 'jina-embeddings-v3',
          data: body.input.map((_, i) => ({ index: startIndex + i, embedding: emb })),
          usage: { prompt_tokens: 10, total_tokens: 10 },
        }),
      }
    }))

    const result = await embedBatch(texts)
    // 130 texts → 2 API calls (128 + 2)
    expect(callCount).toBe(2)
    expect(result).toHaveLength(130)
  })
})
