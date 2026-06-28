'use client'

import Link from 'next/link'
import { Pencil, Trash2, Paperclip, PowerOff, Power, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { QAPairWithMedia } from '@/types'

export type QASortKey = 'question' | 'answer' | 'category' | 'media' | 'status'
export type SortDir = 'asc' | 'desc'

interface QATableProps {
  pairs: QAPairWithMedia[]
  sortKey: QASortKey | null
  sortDir: SortDir
  onSort: (key: QASortKey) => void
  onDelete: (id: string) => void
  onToggle: (pair: QAPairWithMedia) => void
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="size-3 ms-1 shrink-0 opacity-40" />
  return dir === 'asc'
    ? <ChevronUp className="size-3 ms-1 shrink-0" />
    : <ChevronDown className="size-3 ms-1 shrink-0" />
}

function SortHead({
  label,
  sortK,
  currentKey,
  dir,
  onSort,
  className,
}: {
  label: string
  sortK: QASortKey
  currentKey: QASortKey | null
  dir: SortDir
  onSort: (k: QASortKey) => void
  className?: string
}) {
  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-muted/60 transition-colors', className)}
      onClick={() => onSort(sortK)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon active={currentKey === sortK} dir={dir} />
      </div>
    </TableHead>
  )
}

export function QATable({ pairs, sortKey, sortDir, onSort, onDelete, onToggle }: QATableProps) {
  if (!pairs.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">לא נמצאו שאלות ותשובות.</p>
        <p className="text-xs mt-1">
          לחץ על &quot;שאלה חדשה&quot; כדי להתחיל.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-auto max-h-[960px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <SortHead label="שאלה" sortK="question" currentKey={sortKey} dir={sortDir} onSort={onSort} />
            <SortHead label="תשובה (תצוגה מקדימה)" sortK="answer" currentKey={sortKey} dir={sortDir} onSort={onSort} className="hidden sm:table-cell" />
            <SortHead label="קטגוריה" sortK="category" currentKey={sortKey} dir={sortDir} onSort={onSort} className="hidden md:table-cell" />
            <SortHead label="קבצים" sortK="media" currentKey={sortKey} dir={sortDir} onSort={onSort} className="w-20 text-center" />
            <SortHead label="סטטוס" sortK="status" currentKey={sortKey} dir={sortDir} onSort={onSort} className="w-20 text-center" />
            <TableHead className="w-32 text-center">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <TableRow key={pair.id} className="hover:bg-muted/20">
              <TableCell className="font-medium max-w-[200px]">
                <p className="truncate" title={pair.question}>
                  {pair.question}
                </p>
              </TableCell>

              <TableCell className="hidden sm:table-cell max-w-[240px] text-muted-foreground text-sm">
                <p className="truncate" title={pair.answer}>
                  {pair.answer}
                </p>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                {pair.category ? (
                  <Badge variant="secondary">{pair.category}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>

              <TableCell className="text-center">
                {pair.qa_media.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="size-3" />
                    {pair.qa_media.length}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>

              <TableCell className="text-center">
                <Badge variant={pair.is_active ? 'default' : 'secondary'}>
                  {pair.is_active ? 'פעיל' : 'מושבת'}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Link
                    href={`/admin/qa/${pair.id}/edit`}
                    aria-label="ערוך"
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon' }),
                      'size-8 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'size-8 text-muted-foreground',
                      pair.is_active
                        ? 'hover:text-amber-600'
                        : 'hover:text-green-600',
                    )}
                    onClick={() => onToggle(pair)}
                    aria-label={pair.is_active ? 'השבת' : 'הפעל'}
                  >
                    {pair.is_active ? (
                      <PowerOff className="size-4" />
                    ) : (
                      <Power className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(pair.id)}
                    aria-label="מחק"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
