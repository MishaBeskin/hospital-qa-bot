'use client'

import { Stethoscope, Calendar, CreditCard, FileText, Clock } from 'lucide-react'

interface EmptyStateProps {
  onSelectQuestion: (question: string) => void
}

const EXAMPLE_QUESTIONS = [
  { icon: Calendar, label: 'כמה ימי חופשה שנתית מגיעים לי?' },
  { icon: CreditCard, label: 'מתי ואיך מקבלים תלוש שכר?' },
  { icon: FileText, label: 'איך מגישים בקשת חופשת מחלה?' },
  { icon: Clock, label: 'מה שעות העבודה והמשמרות?' },
]

export function EmptyState({ onSelectQuestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-10 text-center select-none">
      {/* Avatar */}
      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 shrink-0">
        <Stethoscope className="size-8 text-primary" aria-hidden />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-1">
        שלום, כיצד אוכל לעזור לך?
      </h2>
      <p className="text-sm text-muted-foreground mb-7 max-w-xs leading-relaxed">
        שאל שאלה בנושאי שכר, חופשות, נוכחות או כל נושא אחר במחלקת משאבי אנוש.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {EXAMPLE_QUESTIONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => onSelectQuestion(label)}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 text-sm text-start transition-colors group"
          >
            <Icon className="size-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-foreground/80 leading-snug">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
