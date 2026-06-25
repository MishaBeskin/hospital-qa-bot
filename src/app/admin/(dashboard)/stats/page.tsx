import { StatsCards } from '@/components/admin/StatsCards'
import type { StatsOverview, TopQAPair, UnansweredQuestion } from '@/types'

// Mock data — replace with Supabase aggregation query
const MOCK_OVERVIEW: StatsOverview = {
  total_messages: 342,
  matched_messages: 298,
  unmatched_messages: 44,
  match_rate: 298 / 342,
}

const MOCK_TOP_PAIRS: TopQAPair[] = [
  {
    qa_pair: {
      id: '1',
      question: 'כמה ימי חופשה מגיעים לי בשנה?',
      answer: '',
      category: 'חופשות',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    hit_count: 87,
  },
  {
    qa_pair: {
      id: '3',
      question: 'מה שעות העבודה הרגילות?',
      answer: '',
      category: 'נוכחות',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    hit_count: 64,
  },
  {
    qa_pair: {
      id: '2',
      question: 'איך אני מגיש בקשה לחופשת מחלה?',
      answer: '',
      category: 'מחלה',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    hit_count: 51,
  },
]

const MOCK_UNANSWERED: UnansweredQuestion[] = [
  { id: 'u1', question: 'האם יש קרן השתלמות לעובדים?', session_id: 's1', created_at: new Date(Date.now() - 3_600_000).toISOString() },
  { id: 'u2', question: 'מה קורה עם ימי חופשה שלא נוצלו בסוף שנה?', session_id: 's2', created_at: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 'u3', question: 'איך פותחים תלוש שכר ישן?', session_id: 's3', created_at: new Date(Date.now() - 172_800_000).toISOString() },
]

export default function StatsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">סטטיסטיקות</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          סקירת פעילות מערכת השאלות והתשובות
        </p>
      </div>
      <StatsCards
        overview={MOCK_OVERVIEW}
        topPairs={MOCK_TOP_PAIRS}
        recentUnanswered={MOCK_UNANSWERED}
      />
    </div>
  )
}
