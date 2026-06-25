import { AdminQAForm } from '@/components/admin/AdminQAForm'
import type { QAPairWithMedia } from '@/types'

// Mock fetch — replace with Supabase query
function getMockPair(id: string): QAPairWithMedia {
  return {
    id,
    question: 'כמה ימי חופשה מגיעים לי בשנה?',
    answer:
      'עובדי בית החולים זכאים ל-18 ימי חופשה בשנה הראשונה לעבודה, ו-21 ימים משנת עבודה שנייה ואילך.',
    category: 'חופשות',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    qa_media: [],
  }
}

export default async function EditQAPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pair = getMockPair(id)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">עריכת שאלה</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          עדכן שאלה ותשובה קיימת
        </p>
      </div>
      <AdminQAForm initialData={pair} />
    </div>
  )
}
