export interface QAMedia {
  id: string
  qa_pair_id: string
  file_url: string
  file_type: 'image' | 'pdf'
  display_order: number
  created_at: string
}

export interface QAPair {
  id: string
  question: string
  answer: string
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QAPairWithMedia extends QAPair {
  qa_media: QAMedia[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  matched_qa_id?: string | null
  similarity_score?: number | null
  media?: QAMedia[]
}

export interface UnansweredQuestion {
  id: string
  question: string
  session_id: string
  created_at: string
}

export interface StatsOverview {
  total_messages: number
  matched_messages: number
  unmatched_messages: number
  match_rate: number
}

export interface TopQAPair {
  qa_pair: QAPair
  hit_count: number
}

export interface DailyCount {
  day: string   // 'YYYY-MM-DD'
  count: number
}

export interface TopQAPairStat {
  id: string
  question: string
  category: string | null
  is_active: boolean
  hit_count: number
}
