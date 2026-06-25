'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MediaUploader, type UploadedFile } from './MediaUploader'
import type { QAPairWithMedia } from '@/types'

interface AdminQAFormProps {
  initialData?: QAPairWithMedia
}

export function AdminQAForm({ initialData }: AdminQAFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [question, setQuestion] = useState(initialData?.question ?? '')
  const [answer, setAnswer] = useState(initialData?.answer ?? '')
  const [category, setCategory] = useState(initialData?.category ?? '')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!question.trim()) e.question = 'שאלה היא שדה חובה'
    if (!answer.trim()) e.answer = 'תשובה היא שדה חובה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    try {
      // API call will go here
      await new Promise((r) => setTimeout(r, 600))
      router.push('/admin/qa')
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">
        {/* Q&A Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תוכן השאלה והתשובה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="question">
                שאלה <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="הזן את השאלה כפי שהמשתמש עשוי לשאול..."
                rows={3}
                className={errors.question ? 'border-destructive' : ''}
              />
              {errors.question && (
                <p className="text-xs text-destructive">{errors.question}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">
                תשובה <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="הזן את התשובה המאושרת. זוהי התשובה שתוצג למשתמשים בדיוק כפי שהיא."
                rows={6}
                className={errors.answer ? 'border-destructive' : ''}
              />
              {errors.answer && (
                <p className="text-xs text-destructive">{errors.answer}</p>
              )}
              <p className="text-xs text-muted-foreground">
                תשובה זו תוצג למשתמשים כפי שהיא, ללא שינוי.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מאפיינים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="למשל: חופשות, שכר, נוכחות..."
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-active" className="text-sm font-medium">
                  פעיל
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  כשמושבת, שאלה זו לא תופיע בתוצאות החיפוש
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">קבצים מצורפים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing media from initialData */}
            {isEditing && initialData.qa_media.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  קבצים קיימים
                </p>
                <ul className="space-y-2">
                  {initialData.qa_media.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30 text-sm"
                    >
                      <span className="flex-1 truncate text-muted-foreground">
                        {m.file_url.split('/').pop()}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {m.file_type === 'pdf' ? 'PDF' : 'תמונה'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <MediaUploader value={newFiles} onChange={setNewFiles} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-start">
          <Button type="submit" disabled={isSaving} className="gap-2">
            <Save className="size-4" />
            {isSaving ? 'שומר...' : isEditing ? 'עדכן שאלה' : 'צור שאלה'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <X className="size-4" />
            ביטול
          </Button>
        </div>
      </div>
    </form>
  )
}
