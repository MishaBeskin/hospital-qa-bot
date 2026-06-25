'use client'

import Link from 'next/link'
import { Pencil, Trash2, Paperclip } from 'lucide-react'
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

interface QATableProps {
  pairs: QAPairWithMedia[]
  onDelete: (id: string) => void
}

export function QATable({ pairs, onDelete }: QATableProps) {
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
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>שאלה</TableHead>
            <TableHead className="hidden sm:table-cell">תשובה (תצוגה מקדימה)</TableHead>
            <TableHead className="hidden md:table-cell">קטגוריה</TableHead>
            <TableHead className="w-20 text-center">קבצים</TableHead>
            <TableHead className="w-20 text-center">סטטוס</TableHead>
            <TableHead className="w-28 text-center">פעולות</TableHead>
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
