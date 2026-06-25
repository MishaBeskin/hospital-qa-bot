'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { ChatMessage } from '@/types'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'שלום! אני עוזר ה-HR של בית החולים. אני יכול לענות על שאלות בנושאי שכר, חופשות, נוכחות ועוד. כיצד אוכל לעזור לך היום?',
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, message: text }),
        })
        const data = await res.json()
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          matched_qa_id: data.matched_qa_id ?? null,
          similarity_score: data.similarity_score ?? null,
          media: data.media ?? [],
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'אירעה שגיאה. אנא נסה שוב.',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId],
  )

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-3 sm:px-6">
        <div className="max-w-3xl mx-auto py-6 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-card border border-border rounded-2xl rounded-ss-sm px-4 py-3 text-sm text-muted-foreground">
                <span className="animate-pulse">מחפש תשובה...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
