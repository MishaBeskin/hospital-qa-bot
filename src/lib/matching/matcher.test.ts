import { describe, it, expect, vi, beforeEach } from 'vitest'
import { matchQuestion, DEFAULT_SIMILARITY_THRESHOLD } from './matcher'

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/embeddings/jina', () => ({
  embedText: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { embedText } from '@/lib/embeddings/jina'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_EMBEDDING = Array.from({ length: 1024 }, () => 0.1)

function makeQARow(overrides: Partial<{
  id: string; question: string; answer: string; category: string | null
  is_active: boolean; created_at: string; updated_at: string
}> = {}) {
  return {
    id: 'qa-1',
    question: 'מה הצהרת שעות עבודה?',
    answer: 'שעות העבודה הן 8:00–16:00.',
    category: 'שעות',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeMediaRow(displayOrder = 0) {
  return {
    id: `media-${displayOrder}`,
    qa_pair_id: 'qa-1',
    file_url: `https://example.com/file-${displayOrder}.jpg`,
    file_type: 'image' as const,
    display_order: displayOrder,
    created_at: '2024-01-01T00:00:00Z',
  }
}

/** Builds a minimal Supabase client mock with chainable `.from()` query builder. */
function makeSupabaseMock(config: {
  rpcResults: Array<{ data: unknown; error: null | { message: string } }>
  fromResults?: Array<{ data: unknown; error: null | { message: string } }>
}) {
  let rpcCallCount = 0
  let fromCallCount = 0

  const mock = {
    rpc: vi.fn(() => {
      const result = config.rpcResults[rpcCallCount] ?? config.rpcResults.at(-1)!
      rpcCallCount++
      return Promise.resolve(result)
    }),
    from: vi.fn(() => {
      const fromResults = config.fromResults ?? []
      const result = fromResults[fromCallCount] ?? fromResults.at(-1)
      fromCallCount++

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(() => Promise.resolve(result ?? { data: null, error: null })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
        then: vi.fn((fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn)),
      }
    }),
  }

  return mock
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(embedText).mockResolvedValue(MOCK_EMBEDDING)
})

describe('matchQuestion — vector match', () => {
  it('returns qa and score when vector similarity is above threshold', async () => {
    const qaRow = makeQARow()
    const media = [makeMediaRow(0), makeMediaRow(1)]
    const supabase = makeSupabaseMock({
      rpcResults: [{ data: [{ ...qaRow, similarity: 0.9 }], error: null }],
      fromResults: [{ data: { ...qaRow, qa_media: media }, error: null }],
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const result = await matchQuestion('מה שעות העבודה?')

    expect(result.qa).not.toBeNull()
    expect(result.qa?.id).toBe('qa-1')
    expect(result.score).toBe(0.9)
    expect(result.media).toHaveLength(2)
  })

  it('sorts media by display_order ascending', async () => {
    const qaRow = makeQARow()
    const media = [makeMediaRow(2), makeMediaRow(0), makeMediaRow(1)]
    const supabase = makeSupabaseMock({
      rpcResults: [{ data: [{ ...qaRow, similarity: 0.85 }], error: null }],
      fromResults: [{ data: { ...qaRow, qa_media: media }, error: null }],
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const result = await matchQuestion('שאלה')

    expect(result.media.map((m) => m.display_order)).toEqual([0, 1, 2])
  })

  it('uses the custom threshold option when provided', async () => {
    const supabase = makeSupabaseMock({
      rpcResults: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      fromResults: [{ data: null, error: null }],
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    await matchQuestion('question', { threshold: 0.99 })

    expect(supabase.rpc).toHaveBeenCalledWith('match_qa_pair', expect.objectContaining({
      match_threshold: 0.99,
    }))
  })

  it('throws when the RPC call fails', async () => {
    const supabase = makeSupabaseMock({
      rpcResults: [{ data: null, error: { message: 'connection refused' } }],
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    await expect(matchQuestion('שאלה')).rejects.toThrow('Similarity search failed')
  })

  it('throws when fetching the matched Q&A pair fails', async () => {
    const qaRow = makeQARow()
    const supabase = makeSupabaseMock({
      rpcResults: [{ data: [{ ...qaRow, similarity: 0.9 }], error: null }],
      fromResults: [{ data: null, error: { message: 'not found' } }],
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    await expect(matchQuestion('שאלה')).rejects.toThrow('Failed to fetch matched Q&A pair')
  })
})

describe('matchQuestion — no vector match', () => {
  it('returns null qa when no match and no keyword fallback', async () => {
    const supabase = makeSupabaseMock({
      rpcResults: [
        { data: [], error: null }, // below threshold → empty
        { data: [], error: null }, // debug call at threshold=0
      ],
      fromResults: [{ data: [], error: null }], // keyword fallback returns nothing
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const result = await matchQuestion('שאלה שאין לה תשובה')

    expect(result.qa).toBeNull()
    expect(result.score).toBe(0)
    expect(result.media).toEqual([])
  })

  it('returns keyword fallback result when vector fails but keyword matches', async () => {
    const qaRow = makeQARow()
    const media = [makeMediaRow(0)]
    const supabase = makeSupabaseMock({
      rpcResults: [
        { data: [], error: null }, // vector miss
        { data: [], error: null }, // debug at threshold=0
      ],
      fromResults: [{ data: [{ ...qaRow, qa_media: media }], error: null }],
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const result = await matchQuestion('שעות עבודה')

    expect(result.qa).not.toBeNull()
    expect(result.score).toBe(0)
    expect(result.media).toHaveLength(1)
  })

  it('uses DEFAULT_SIMILARITY_THRESHOLD when no threshold option is provided', async () => {
    const supabase = makeSupabaseMock({
      rpcResults: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      fromResults: [{ data: [], error: null }],
    })
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    await matchQuestion('question')

    expect(supabase.rpc).toHaveBeenCalledWith('match_qa_pair', expect.objectContaining({
      match_threshold: DEFAULT_SIMILARITY_THRESHOLD,
    }))
  })
})
