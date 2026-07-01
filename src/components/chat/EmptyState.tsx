'use client'

import { useState } from 'react'
import { Stethoscope, Calendar, Heart, CreditCard, Clock, FileText, Shield, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  onSelectQuestion: (question: string) => void
}

interface Topic {
  id: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  label: string
  description: string
  questions: string[]
}

const TOPICS: Topic[] = [
  {
    id: 'vacation',
    icon: Calendar,
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'חופשות',
    description: 'ימי חופשה, צבירה ובקשות',
    questions: [
      'כמה ימי חופשה שנתית מגיעים לי?',
      'איך מגישים בקשת חופשה?',
      'האם ניתן לצבור ימי חופשה משנה לשנה?',
      'מה קורה עם ימי החופשה בסיום העסקה?',
    ],
  },
  {
    id: 'sick',
    icon: Heart,
    iconBg: 'bg-rose-100 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
    label: 'מחלה',
    description: 'ימי מחלה, אישורים ונהלים',
    questions: [
      'איך מגישים בקשת חופשת מחלה?',
      'כמה ימי מחלה מגיעים לי בשנה?',
      'אילו מסמכים יש לצרף לאישור מחלה?',
      'האם ניתן לנצל ימי מחלה לטיפולי ילדים?',
    ],
  },
  {
    id: 'salary',
    icon: CreditCard,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'שכר',
    description: 'תלוש שכר, תשלומים ובונוסים',
    questions: [
      'מתי ואיך מקבלים תלוש שכר?',
      'מה כוללת חבילת ההטבות לעובדים?',
      'איך מדווחים על שעות נוספות לתשלום?',
      'כיצד מחושב שכר עבודה בחגים?',
    ],
  },
  {
    id: 'shifts',
    icon: Clock,
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'משמרות ונוכחות',
    description: 'לוח משמרות, שעות ועבודה מהבית',
    questions: [
      'מה שעות העבודה והמשמרות?',
      'איך מדווחים על נוכחות?',
      'מה מדיניות העבודה מהבית?',
      'איך מבקשים שינוי במשמרת?',
    ],
  },
  {
    id: 'docs',
    icon: FileText,
    iconBg: 'bg-violet-100 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    label: 'מסמכים',
    description: 'טפסים, אישורים ומסמכי HR',
    questions: [
      'איך מקבלים אישור העסקה?',
      'איפה ניתן למצוא טפסי HR?',
      'כמה זמן לוקח לקבל מסמכים רשמיים?',
      'איך מעדכנים פרטים אישיים במערכת?',
    ],
  },
  {
    id: 'rights',
    icon: Shield,
    iconBg: 'bg-sky-100 dark:bg-sky-950',
    iconColor: 'text-sky-600 dark:text-sky-400',
    label: 'זכויות עובד',
    description: 'הטבות, זכויות ותנאי העסקה',
    questions: [
      'אילו הטבות מגיעות לעובדי בית החולים?',
      'מה זכויותיי כעובד חדש?',
      'האם יש קרן פנסיה לעובדים?',
      'איך מגישים תלונה על הפרת זכויות?',
    ],
  },
]

export function EmptyState({ onSelectQuestion }: EmptyStateProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center select-none">
      {/* Avatar */}
      <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shrink-0">
        <Stethoscope className="size-7 text-primary" aria-hidden />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-1">
        שלום, כיצד אוכל לעזור לך?
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
        {selectedTopic
          ? `בחר שאלה בנושא ${selectedTopic.label}`
          : 'בחר נושא כדי לראות שאלות נפוצות, או כתוב שאלה חופשית למטה.'}
      </p>

      {selectedTopic ? (
        /* ── Questions view ──────────────────────────────────── */
        <div className="w-full max-w-md space-y-2">
          {/* Back button */}
          <button
            onClick={() => setSelectedTopic(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 mx-auto"
          >
            <ChevronRight className="size-4" />
            חזרה לנושאים
          </button>

          {/* Topic label */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex size-7 items-center justify-center rounded-lg ${selectedTopic.iconBg}`}>
              <selectedTopic.icon className={`size-4 ${selectedTopic.iconColor}`} />
            </div>
            <span className="text-sm font-semibold text-foreground">{selectedTopic.label}</span>
          </div>

          {selectedTopic.questions.map((q) => (
            <button
              key={q}
              onClick={() => onSelectQuestion(q)}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 text-sm text-start transition-colors group"
            >
              <selectedTopic.icon className={`size-4 ${selectedTopic.iconColor} shrink-0 mt-0.5 group-hover:scale-110 transition-transform`} />
              <span className="text-foreground/80 leading-snug">{q}</span>
            </button>
          ))}
        </div>
      ) : (
        /* ── Topics grid ─────────────────────────────────────── */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-lg">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className="flex flex-col items-center gap-2.5 px-3 py-4 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/30 transition-colors group text-center"
            >
              <div className={`flex size-10 items-center justify-center rounded-xl ${topic.iconBg} group-hover:scale-105 transition-transform`}>
                <topic.icon className={`size-5 ${topic.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{topic.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug hidden sm:block">
                  {topic.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
