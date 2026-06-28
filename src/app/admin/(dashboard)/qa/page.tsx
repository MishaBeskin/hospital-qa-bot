'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2 } from 'lucide-react'
import { buttonVariants, Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QATable, type QASortKey, type SortDir } from '@/components/admin/QATable'
import { DataPagination } from '@/components/ui/data-pagination'
import type { QAPairWithMedia } from '@/types'

function getSortVal(pair: QAPairWithMedia, key: QASortKey): string | number {
  switch (key) {
    case 'question': return pair.question.toLowerCase()
    case 'answer':   return pair.answer.toLowerCase()
    case 'category': return (pair.category ?? '').toLowerCase()
    case 'media':    return pair.qa_media.length
    case 'status':   return pair.is_active ? 0 : 1
  }
}

export default function QAListPage() {
  const [pairs, setPairs] = useState<QAPairWithMedia[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [sortKey, setSortKey] = useState<QASortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchPairs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/qa')
      if (!res.ok) throw new Error('Failed to fetch')
      setPairs(await res.json())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPairs()
  }, [fetchPairs])

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function toggleSort(key: QASortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  function handleDelete(id: string) {
    setPendingDeleteId(id)
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/qa/${pendingDeleteId}`, { method: 'DELETE' })
      if (res.ok) setPairs((prev) => prev.filter((p) => p.id !== pendingDeleteId))
    } finally {
      setIsDeleting(false)
      setPendingDeleteId(null)
    }
  }

  async function handleToggle(pair: QAPairWithMedia) {
    const res = await fetch(`/api/admin/qa/${pair.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: pair.question,
        answer: pair.answer,
        category: pair.category,
        is_active: !pair.is_active,
      }),
    })
    if (res.ok) {
      const updated: QAPairWithMedia = await res.json()
      setPairs((prev) => prev.map((p) => (p.id === pair.id ? updated : p)))
    }
  }

  const filtered = useMemo(
    () =>
      pairs.filter(
        (p) =>
          p.question.includes(search) ||
          p.answer.includes(search) ||
          (p.category ?? '').includes(search),
      ),
    [pairs, search],
  )

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = getSortVal(a, sortKey)
      const bv = getSortVal(b, sortKey)
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">שאלות ותשובות</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? 'טוען...' : `${pairs.length} שאלות במאגר`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/qa/new" className={cn(buttonVariants(), 'gap-2 shrink-0')}>
            <Plus className="size-4" />
            שאלה חדשה
          </Link>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="חיפוש שאלות..."
          className="ps-9"
        />
      </div>

      <QATable
        pairs={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />

      <DataPagination
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Dialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת שאלה</DialogTitle>
            <DialogDescription>
              פעולה זו אינה ניתנת לביטול. השאלה והתשובה יימחקו לצמיתות.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingDeleteId(null)} disabled={isDeleting}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="gap-2">
              {isDeleting ? 'מוחק...' : 'מחק'}
              <Trash2 className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
