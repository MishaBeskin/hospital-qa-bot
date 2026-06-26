import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedBatch } from '@/lib/embeddings/jina'

export async function POST() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('qa_pairs')
    .select('id, question')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ updated: 0 })

  const embeddings = await embedBatch(
    data.map((r) => r.question),
    'retrieval.passage',
  )

  const updates = await Promise.all(
    data.map((row, i) =>
      admin
        .from('qa_pairs')
        .update({ embedding: embeddings[i] })
        .eq('id', row.id),
    ),
  )

  const failed = updates.filter((r) => r.error).length
  return NextResponse.json({ updated: data.length - failed, failed })
}
