import { createAdminClient } from '@/lib/supabase/admin'
import { OverviewCards, TopQATable } from '@/components/admin/StatsCards'
import { DailyChart } from '@/components/admin/DailyChart'
import { UnansweredList } from '@/components/admin/UnansweredList'
import type { DailyCount, TopQAPairStat, UnansweredQuestion } from '@/types'

export default async function StatsPage() {
  const admin = createAdminClient()

  // Week start = this Sunday (Israeli work week)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const [
    { count: totalAll },
    { count: totalThisWeek },
    { count: totalToday },
    { count: totalMatched },
    { count: totalUnmatched },
    { data: rawDaily },
    { data: rawTopPairs },
    { data: rawUnanswered },
  ] = await Promise.all([
    admin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user'),
    admin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', weekStart.toISOString()),
    admin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', todayStart),
    admin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assistant')
      .not('matched_qa_id', 'is', null),
    admin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assistant')
      .is('matched_qa_id', null),
    admin.rpc('get_daily_message_counts', { days_back: 30 }),
    admin.rpc('get_top_qa_pairs', { limit_n: 10 }),
    admin
      .from('unanswered_questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const matched = totalMatched ?? 0
  const unmatched = totalUnmatched ?? 0
  const totalAnswered = matched + unmatched
  const matchRate = totalAnswered > 0 ? matched / totalAnswered : 0

  const dailyCounts: DailyCount[] = (rawDaily ?? []).map((r: Record<string, unknown>) => ({
    day: String(r.day),
    count: Number(r.count),
  }))

  const topPairs: TopQAPairStat[] = (rawTopPairs ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    question: String(r.question),
    category: r.category ? String(r.category) : null,
    is_active: Boolean(r.is_active),
    hit_count: Number(r.hit_count),
  }))

  const unanswered: UnansweredQuestion[] = (rawUnanswered ?? []) as UnansweredQuestion[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">סטטיסטיקות</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          סקירת פעילות מערכת השאלות והתשובות
        </p>
      </div>

      <OverviewCards
        totalAll={totalAll ?? 0}
        totalThisWeek={totalThisWeek ?? 0}
        totalToday={totalToday ?? 0}
        matched={matched}
        unmatched={unmatched}
        matchRate={matchRate}
      />

      <DailyChart data={dailyCounts} />

      <TopQATable pairs={topPairs} />

      <UnansweredList items={unanswered} />
    </div>
  )
}
