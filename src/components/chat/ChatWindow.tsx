'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { EmptyState } from './EmptyState'
import type { ChatMessage } from '@/types'

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text, sessionId }),
        })

        if (!res.ok) throw new Error('Network error')

        const data = await res.json()
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          created_at: new Date().toISOString(),
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
            content: 'אירעה שגיאה בעת החיפוש. אנא נסה שוב.',
            created_at: new Date().toISOString(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId],
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {isEmpty && !isLoading ? (
        <div className="flex-1 overflow-y-auto">
          <EmptyState onSelectQuestion={handleSend} />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      )}

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-end">
      <div className="bg-card border border-border rounded-2xl rounded-ss-sm px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
