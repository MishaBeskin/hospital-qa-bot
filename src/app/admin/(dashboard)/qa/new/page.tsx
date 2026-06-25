import { AdminQAForm } from '@/components/admin/AdminQAForm'

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
      <AdminQAForm initialQuestion={question} />
    </div>
  )
}
