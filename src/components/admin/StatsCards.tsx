import { MessageSquare, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StatsOverview, TopQAPair, UnansweredQuestion } from '@/types'

interface StatsCardsProps {
  overview: StatsOverview
  topPairs: TopQAPair[]
  recentUnanswered: UnansweredQuestion[]
}

export function StatsCards({ overview, topPairs, recentUnanswered }: StatsCardsProps) {
  const matchPct = overview.match_rate * 100

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="סה״כ שאלות"
          value={overview.total_messages.toLocaleString('he-IL')}
          icon={<MessageSquare className="size-5 text-primary" />}
          bg="bg-primary/8"
        />
        <StatCard
          label="שאלות שנענו"
          value={overview.matched_messages.toLocaleString('he-IL')}
          icon={<CheckCircle className="size-5 text-emerald-600" />}
          bg="bg-emerald-50"
        />
        <StatCard
          label="ללא תשובה"
          value={overview.unmatched_messages.toLocaleString('he-IL')}
          icon={<XCircle className="size-5 text-amber-600" />}
          bg="bg-amber-50"
        />
        <StatCard
          label="אחוז התאמה"
          value={`${matchPct.toFixed(1)}%`}
          icon={<TrendingUp className="size-5 text-primary" />}
          bg="bg-primary/8"
        />
      </div>

      {/* Top Q&A pairs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">שאלות נפוצות ביותר</CardTitle>
        </CardHeader>
        <CardContent>
          {topPairs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              אין נתונים עדיין
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>שאלה</TableHead>
                  <TableHead className="hidden sm:table-cell">קטגוריה</TableHead>
                  <TableHead className="text-center">כמות שאילתות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPairs.map(({ qa_pair, hit_count }, idx) => (
                  <TableRow key={qa_pair.id}>
                    <TableCell className="text-muted-foreground text-sm w-8">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px]">
                      <p className="truncate" title={qa_pair.question}>
                        {qa_pair.question}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {qa_pair.category ? (
                        <Badge variant="secondary">{qa_pair.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {hit_count.toLocaleString('he-IL')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent unanswered */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">שאלות ללא תשובה — אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUnanswered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              כל השאלות נענו!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שאלה</TableHead>
                  <TableHead className="w-36 text-center">תאריך</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUnanswered.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="text-sm">{q.question}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString('he-IL')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string
  value: string
  icon: React.ReactNode
  bg: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className={`inline-flex rounded-lg p-2 mb-3 ${bg}`}>{icon}</div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
