import Link from 'next/link'
import { PlusCircle, CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UnansweredQuestion } from '@/types'

interface UnansweredListProps {
  items: UnansweredQuestion[]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `לפני ${mins} דקות`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שעות`
  const days = Math.floor(hrs / 24)
  return `לפני ${days} ימים`
}

export function UnansweredList({ items }: UnansweredListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">שאלות ללא תשובה</CardTitle>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-8 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">מצוין! כל השאלות נענו</p>
            <p className="text-xs text-muted-foreground">
              אין שאלות ממתינות ליצירת תשובה
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((q) => (
              <li key={q.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(q.created_at)}</p>
                </div>
                <Link
                  href={`/admin/qa/new?question=${encodeURIComponent(q.question)}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'shrink-0 gap-1.5 h-7 px-2.5 text-xs',
                  )}
                >
                  <PlusCircle className="size-3.5" />
                  צור שאלה
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
