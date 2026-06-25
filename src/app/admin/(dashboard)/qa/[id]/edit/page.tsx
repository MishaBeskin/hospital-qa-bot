import { redirect } from 'next/navigation'
import { AdminQAForm } from '@/components/admin/AdminQAForm'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function EditQAPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const admin = createAdminClient()
  const { data: pair, error } = await admin
    .from('qa_pairs')
    .select('*, qa_media(*)')
    .eq('id', id)
    .single()

  if (error || !pair) redirect('/admin/qa')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">עריכת שאלה</h1>
        <p className="text-sm text-muted-foreground mt-0.5">עדכן שאלה ותשובה קיימת</p>
      </div>
      <AdminQAForm initialData={pair} />
    </div>
  )
}
