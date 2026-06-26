import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/embeddings/jina'

type Params = { params: Promise<{ id: string }> }

function extractStoragePath(fileUrl: string): string {
  const marker = '/object/public/qa-attachments/'
  const idx = fileUrl.indexOf(marker)
  return idx !== -1 ? fileUrl.slice(idx + marker.length) : fileUrl
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qa_pairs')
    .select('id, question, answer, category, is_active, created_at, qa_media(*)')
    .eq('id', id)
    .single()

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { question, answer, category, is_active } = body

  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'question and answer are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('qa_pairs')
    .select('question')
    .eq('id', id)
    .single()

  const updates: Record<string, unknown> = {
    question: question.trim(),
    answer: answer.trim(),
    category: category?.trim() || null,
    is_active,
  }

  if (!existing || existing.question !== question.trim()) {
    updates.embedding = await embedText(`${question.trim()} ${answer.trim()}`, 'retrieval.passage')
  }

  const { data, error } = await admin
    .from('qa_pairs')
    .update(updates)
    .eq('id', id)
    .select('id, question, answer, category, is_active, created_at, qa_media(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: mediaFiles } = await admin
    .from('qa_media')
    .select('file_url')
    .eq('qa_pair_id', id)

  if (mediaFiles?.length) {
    const paths = mediaFiles.map((m) => extractStoragePath(m.file_url))
    await admin.storage.from('qa-attachments').remove(paths)
  }

  const { error } = await admin.from('qa_pairs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
