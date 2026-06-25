import type { Metadata } from 'next'
import { ChatScreen } from '@/components/chat/ChatScreen'

export const metadata: Metadata = {
  title: 'עוזר HR | מחלקת משאבי אנוש',
  description: 'מערכת שאלות ותשובות לעובדי בית החולים',
}

export default function ChatPage() {
  return <ChatScreen />
}
