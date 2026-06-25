import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ mediaId: string }> }

function extractStoragePath(fileUrl: string): string {
  const marker = '/object/public/qa-attachments/'
  const idx = fileUrl.indexOf(marker)
  return idx !== -1 ? fileUrl.slice(idx + marker.length) : fileUrl
}

export async function DELETE(_req: Request, { params }: Params) {
  const { mediaId } = await params
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: media } = await admin
    .from('qa_media')
    .select('file_url')
    .eq('id', mediaId)
    .single()

  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const path = extractStoragePath(media.file_url)
  await admin.storage.from('qa-attachments').remove([path])

  const { error } = await admin.from('qa_media').delete().eq('id', mediaId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
