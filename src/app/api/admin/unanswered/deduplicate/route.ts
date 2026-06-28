import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UnansweredQuestion } from '@/types'

export async function POST() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('unanswered_questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as UnansweredQuestion[]

  // Walk newest-first; first occurrence of each normalised question is kept
  const seen = new Set<string>()
  const toDelete: string[] = []

  for (const row of rows) {
    const key = row.question.trim().toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(key)) {
      toDelete.push(row.id)
    } else {
      seen.add(key)
    }
  }

  if (toDelete.length) {
    const { error: delError } = await admin
      .from('unanswered_questions')
      .delete()
      .in('id', toDelete)

    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: toDelete.length })
}
