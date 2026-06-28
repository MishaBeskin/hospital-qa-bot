'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const WINDOW = 5

export interface DataPaginationProps {
  page: number
  pageCount: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

export function DataPagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataPaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const half = Math.floor(WINDOW / 2)
  let winStart = Math.max(1, page - half)
  const winEnd = Math.min(pageCount, winStart + WINDOW - 1)
  if (winEnd - winStart < WINDOW - 1) winStart = Math.max(1, winEnd - WINDOW + 1)

  const pages: number[] = []
  for (let i = winStart; i <= winEnd; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between gap-3 pt-3 flex-wrap text-sm">
      {/* Rows per page */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-xs">שורות בעמוד</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v))
            onPageChange(1)
          }}
        >
          <SelectTrigger size="sm" className="w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page navigation — prev first in DOM = right side in RTL */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="עמוד קודם"
        >
          <ChevronRight className="size-4" />
        </Button>

        {winStart > 1 && (
          <>
            <Button
              variant={page === 1 ? 'default' : 'outline'}
              size="icon"
              className="size-8 text-xs"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {winStart > 2 && (
              <span className="px-0.5 text-muted-foreground text-xs select-none">…</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            className="size-8 text-xs"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        {winEnd < pageCount && (
          <>
            {winEnd < pageCount - 1 && (
              <span className="px-0.5 text-muted-foreground text-xs select-none">…</span>
            )}
            <Button
              variant={page === pageCount ? 'default' : 'outline'}
              size="icon"
              className="size-8 text-xs"
              onClick={() => onPageChange(pageCount)}
            >
              {pageCount}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="עמוד הבא"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {from}–{to} מתוך {total}
      </p>
    </div>
  )
}
