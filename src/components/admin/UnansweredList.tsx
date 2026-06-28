'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PlusCircle, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, CopyCheck } from 'lucide-react'
import { buttonVariants, Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataPagination } from '@/components/ui/data-pagination'
import type { UnansweredQuestion } from '@/types'

type SortKey = 'question' | 'created_at'
type SortDir = 'asc' | 'desc'

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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="size-3 ms-1 shrink-0 opacity-40" />
  return dir === 'asc'
    ? <ChevronUp className="size-3 ms-1 shrink-0" />
    : <ChevronDown className="size-3 ms-1 shrink-0" />
}

export function UnansweredList({ items: initialItems }: UnansweredListProps) {
  const [items, setItems] = useState(initialItems)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDeduplicating, setIsDeduplicating] = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/unanswered/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((prev) => prev.filter((q) => q.id !== id))
  }

  async function handleDeduplicate() {
    setIsDeduplicating(true)
    try {
      const res = await fetch('/api/admin/unanswered/deduplicate', { method: 'POST' })
      if (!res.ok) return
      const { deleted } = await res.json() as { deleted: number }
      if (deleted > 0) {
        // Re-fetch current list from server by removing duplicates locally
        // (keeps UI in sync without a full page reload)
        const seen = new Set<string>()
        setItems((prev) => prev.filter((q) => {
          const key = q.question.trim().toLowerCase().replace(/\s+/g, ' ')
          if (seen.has(key)) return false
          seen.add(key)
          return true
        }))
      }
    } finally {
      setIsDeduplicating(false)
    }
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = a[sortKey].toLowerCase()
      const bv = b[sortKey].toLowerCase()
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">שאלות ללא תשובה</CardTitle>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-7"
              onClick={handleDeduplicate}
              disabled={isDeduplicating}
            >
              <CopyCheck className="size-3.5" />
              {isDeduplicating ? 'מנקה...' : 'הסר כפולים'}
            </Button>
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
          <>
            <div className="overflow-auto max-h-[410px] rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/60 transition-colors"
                      onClick={() => toggleSort('question')}
                    >
                      <div className="flex items-center">
                        שאלה
                        <SortIcon active={sortKey === 'question'} dir={sortDir} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-32 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                      onClick={() => toggleSort('created_at')}
                    >
                      <div className="flex items-center">
                        זמן
                        <SortIcon active={sortKey === 'created_at'} dir={sortDir} />
                      </div>
                    </TableHead>
                    <TableHead className="w-36">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((q) => (
                    <TableRow key={q.id} className="hover:bg-muted/20">
                      <TableCell className="text-sm leading-snug">
                        {q.question}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(q.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/qa/new?question=${encodeURIComponent(q.question)}`}
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'gap-1.5 h-7 px-2.5 text-xs',
                            )}
                          >
                            <PlusCircle className="size-3.5" />
                            צור שאלה
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDelete(q.id)}
                            aria-label="מחק שאלה"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DataPagination
              page={safePage}
              pageCount={pageCount}
              pageSize={pageSize}
              total={sorted.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50]}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
