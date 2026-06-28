import { describe, it, expect, vi } from 'vitest'
import { getAuthenticatedUser } from './auth'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

function makeSupabaseMock(user: object | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  }
}

describe('getAuthenticatedUser', () => {
  it('returns the user when a session exists', async () => {
    const fakeUser = { id: 'user-123', email: 'admin@hospital.co.il' }
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock(fakeUser) as unknown as Awaited<ReturnType<typeof createClient>>,
    )

    const result = await getAuthenticatedUser()

    expect(result).toEqual(fakeUser)
  })

  it('returns null when there is no session', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock(null) as unknown as Awaited<ReturnType<typeof createClient>>,
    )

    const result = await getAuthenticatedUser()

    expect(result).toBeNull()
  })
})
