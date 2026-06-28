const tips = [
  {
    text: 'נסח שאלות בגוף ראשון, כפי שהעובד היה שואל אותן בפועל.',
    color: 'bg-emerald-50 text-emerald-900 border-emerald-100',
  },
  {
    text: 'תשובות קצרות וממוקדות עובדות טוב יותר ממסמכים ארוכים.',
    color: 'bg-sky-50 text-sky-900 border-sky-100',
  },
  {
    text: 'השתמש בקטגוריות כדי לאפשר סינון מהיר ולשמור על סדר במאגר.',
    color: 'bg-violet-50 text-violet-900 border-violet-100',
  },
]

export function QATips() {
  return (
    <aside className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">טיפים</p>
      {tips.map((tip, i) => (
        <div
          key={i}
          className={`rounded-xl border p-3.5 text-sm leading-relaxed ${tip.color}`}
        >
          {tip.text}
        </div>
      ))}
    </aside>
  )
}
