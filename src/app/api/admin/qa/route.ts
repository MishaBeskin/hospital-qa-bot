import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/embeddings/jina'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qa_pairs')
    .select('id, question, answer, category, is_active, created_at, qa_media(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { question, answer, category, is_active = true } = body

  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'question and answer are required' }, { status: 400 })
  }

  const embedding = await embedText(question.trim(), 'retrieval.passage')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qa_pairs')
    .insert({
      question: question.trim(),
      answer: answer.trim(),
      category: category?.trim() || null,
      is_active,
      embedding,
    })
    .select('id, question, answer, category, is_active, created_at, qa_media(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
