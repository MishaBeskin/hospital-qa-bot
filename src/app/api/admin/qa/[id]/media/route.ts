import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAuthenticatedUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = {
  'image/jpeg': { ext: 'jpg', type: 'image' as const },
  'image/png': { ext: 'png', type: 'image' as const },
  'image/webp': { ext: 'webp', type: 'image' as const },
  'application/pdf': { ext: 'pdf', type: 'pdf' as const },
}

const MAX_SIZE = 10 * 1024 * 1024

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
  }

  const meta = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]
  if (!meta) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const admin = createAdminClient()
  const mediaId = randomUUID()
  const path = `${id}/${mediaId}.${meta.ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from('qa-attachments')
    .upload(path, arrayBuffer, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const {
    data: { publicUrl },
  } = admin.storage.from('qa-attachments').getPublicUrl(path)

  const { data, error } = await admin
    .from('qa_media')
    .insert({
      id: mediaId,
      qa_pair_id: id,
      file_url: publicUrl,
      file_type: meta.type,
      display_order: 0,
    })
    .select()
    .single()

  if (error) {
    await admin.storage.from('qa-attachments').remove([path])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
