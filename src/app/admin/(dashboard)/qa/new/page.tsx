import { AdminQAForm } from '@/components/admin/AdminQAForm'
import { QATips } from '@/components/admin/QATips'

export default async function NewQAPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>
}) {
  const { question } = await searchParams

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">שאלה חדשה</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          הוסף שאלה ותשובה מאושרת למאגר
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-6 items-start">
        <QATips />
        <AdminQAForm initialQuestion={question} />
      </div>
    </div>
  )
}
