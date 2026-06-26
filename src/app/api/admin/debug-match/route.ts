import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/embeddings/jina'

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question } = await request.json()
  if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 })

  const embedding = await embedText(question, 'retrieval.query')

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('match_qa_pair', {
    query_embedding: embedding,
    match_threshold: 0.0,
    match_count: 5,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ results: data })
}
