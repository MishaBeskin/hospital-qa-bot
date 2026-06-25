'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { QATable } from '@/components/admin/QATable'
import type { QAPairWithMedia } from '@/types'

// ── Mock data (replace with Supabase fetch) ────────────────────────────────
const MOCK_PAIRS: QAPairWithMedia[] = [
  {
    id: '1',
    question: 'כמה ימי חופשה מגיעים לי בשנה?',
    answer:
      'עובדי בית החולים זכאים ל-18 ימי חופשה בשנה הראשונה לעבודה, ו-21 ימים משנת עבודה שנייה ואילך.',
    category: 'חופשות',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    qa_media: [],
  },
  {
    id: '2',
    question: 'איך אני מגיש בקשה לחופשת מחלה?',
    answer:
      'יש להגיש אישור רפואי תוך 72 שעות מתחילת ההיעדרות לממונה הישיר ולמחלקת משאבי אנוש.',
    category: 'מחלה',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    qa_media: [
      {
        id: 'm1',
        qa_pair_id: '2',
        file_url: '/sample-form.pdf',
        file_type: 'pdf',
        display_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '3',
    question: 'מה שעות העבודה הרגילות?',
    answer:
      'שעות העבודה הרגילות הן 07:00–15:00. משמרת ערב: 15:00–23:00. משמרת לילה: 23:00–07:00.',
    category: 'נוכחות',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    qa_media: [],
  },
  {
    id: '4',
    question: 'מתי מקבלים תלוש שכר?',
    answer: 'תלוש השכר מועלה לפורטל העובדים בכל ה-5 לחודש.',
    category: 'שכר',
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    qa_media: [],
  },
]
// ──────────────────────────────────────────────────────────────────────────

export default function QAListPage() {
  const [pairs, setPairs] = useState<QAPairWithMedia[]>(MOCK_PAIRS)
  const [search, setSearch] = useState('')

  const filtered = pairs.filter(
    (p) =>
      p.question.includes(search) ||
      p.answer.includes(search) ||
      (p.category ?? '').includes(search),
  )

  function handleDelete(id: string) {
    if (!confirm('האם למחוק שאלה זו?')) return
    setPairs((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">שאלות ותשובות</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pairs.length} שאלות במאגר
          </p>
        </div>
        <Link href="/admin/qa/new" className={cn(buttonVariants(), 'gap-2 shrink-0')}>
          <Plus className="size-4" />
          שאלה חדשה
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש שאלות..."
          className="ps-9"
        />
      </div>

      {/* Table */}
      <QATable pairs={filtered} onDelete={handleDelete} />
    </div>
  )
}
