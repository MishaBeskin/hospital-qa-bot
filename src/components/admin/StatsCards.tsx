import { MessageSquare, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TopQAPairStat } from '@/types'

// ── KPI overview cards ────────────────────────────────────────────────────────

interface OverviewCardsProps {
  totalAll: number
  totalThisWeek: number
  totalToday: number
  matched: number
  unmatched: number
  matchRate: number
}

export function OverviewCards({
  totalAll,
  totalThisWeek,
  totalToday,
  matched,
  unmatched,
  matchRate,
}: OverviewCardsProps) {
  const fmt = (n: number) => n.toLocaleString('he-IL')

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total questions */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-3xl font-bold tracking-tight leading-none">{fmt(totalAll)}</p>
              <p className="text-sm text-muted-foreground mt-1.5">סה״כ שאלות</p>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                <span>השבוע: <span className="text-foreground font-medium">{fmt(totalThisWeek)}</span></span>
                <span>היום: <span className="text-foreground font-medium">{fmt(totalToday)}</span></span>
              </div>
            </div>
            <div className="inline-flex rounded-xl p-2.5 bg-primary/10 shrink-0">
              <MessageSquare className="size-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matched */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-3xl font-bold tracking-tight leading-none">{fmt(matched)}</p>
              <p className="text-sm text-muted-foreground mt-1.5">שאלות שנענו</p>
            </div>
            <div className="inline-flex rounded-xl p-2.5 bg-emerald-50 shrink-0">
              <CheckCircle className="size-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unmatched */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-3xl font-bold tracking-tight leading-none">{fmt(unmatched)}</p>
              <p className="text-sm text-muted-foreground mt-1.5">ללא תשובה</p>
            </div>
            <div className="inline-flex rounded-xl p-2.5 bg-amber-50 shrink-0">
              <XCircle className="size-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match rate */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-bold tracking-tight leading-none">{(matchRate * 100).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-1.5">אחוז התאמה</p>
              <div className="mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${matchRate * 100}%` }}
                />
              </div>
            </div>
            <div className="inline-flex rounded-xl p-2.5 bg-primary/10 shrink-0">
              <TrendingUp className="size-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Top Q&A pairs table ───────────────────────────────────────────────────────

interface TopQATableProps {
  pairs: TopQAPairStat[]
}

export function TopQATable({ pairs }: TopQATableProps) {
  const maxHits = pairs[0]?.hit_count ?? 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">שאלות נפוצות ביותר</CardTitle>
      </CardHeader>
      <CardContent>
        {pairs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">אין נתונים עדיין</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8">#</TableHead>
                <TableHead>שאלה</TableHead>
                <TableHead className="hidden sm:table-cell w-28">קטגוריה</TableHead>
                <TableHead className="hidden md:table-cell w-20 text-center">סטטוס</TableHead>
                <TableHead className="w-36">שאילתות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pairs.map(({ id, question, category, is_active, hit_count }, idx) => (
                <TableRow key={id}>
                  <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <Link
                      href={`/admin/qa/${id}/edit`}
                      className="text-sm font-medium hover:text-primary transition-colors truncate block"
                      title={question}
                    >
                      {question}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {category ? (
                      <Badge variant="secondary">{category}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Badge variant={is_active ? 'default' : 'secondary'}>
                      {is_active ? 'פעיל' : 'מושבת'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums w-8 shrink-0">
                        {hit_count.toLocaleString('he-IL')}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[60px]">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(hit_count / maxHits) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
