import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { matchQuestion } from '@/lib/matching/matcher'
import type { QAMedia } from '@/types'

const FALLBACK_ANSWER =
  'לא נמצא מידע מאושר בנושא זה. אנא פנה למחלקת משאבי אנוש.'

export async function POST(request: Request) {
  // 1. Parse and validate
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { question, sessionId } = body as Record<string, unknown>

  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }
  if (typeof sessionId !== 'string' || !sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const trimmed = question.trim()
  const admin = createAdminClient()

  // 2. Ensure the chat session row exists — chat_messages has a NOT NULL FK on session_id
  const { error: sessionError } = await admin
    .from('chat_sessions')
    .upsert({ id: sessionId }, { onConflict: 'id', ignoreDuplicates: true })

  if (sessionError) {
    console.error('[chat] session upsert failed:', sessionError.message)
    return NextResponse.json({ error: 'Failed to initialise session' }, { status: 500 })
  }

  // 3. Persist user message
  const { error: userMsgError } = await admin.from('chat_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: trimmed,
  })
  if (userMsgError) {
    console.error('[chat] Failed to save user message:', userMsgError.message)
  }

  // 4. RAG matching — matchQuestion also fires-and-forgets to unanswered_questions on miss
  let qa = null
  let score = 0
  let media: QAMedia[] = []

  try {
    const result = await matchQuestion(trimmed, { sessionId })
    qa = result.qa
    score = result.score
    media = result.media
  } catch (err) {
    console.error('[chat] matchQuestion error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const matched = qa !== null
  const answer = matched ? qa!.answer : FALLBACK_ANSWER

  // 5. Persist assistant message
  const { error: assistantMsgError } = await admin.from('chat_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: answer,
    matched_qa_id: qa?.id ?? null,
    similarity_score: matched ? score : null,
  })
  if (assistantMsgError) {
    console.error('[chat] Failed to save assistant message:', assistantMsgError.message)
  }

  return NextResponse.json({
    answer,
    // Full QAMedia objects — MediaViewer needs id, file_url, file_type
    media,
    matched,
    score,
    // Extra fields ChatWindow stores on ChatMessage for potential display
    matched_qa_id: qa?.id ?? null,
    similarity_score: matched ? score : null,
  })
}
