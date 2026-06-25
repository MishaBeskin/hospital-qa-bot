'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { SendHorizonal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-background p-3 sm:p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="shrink-0 size-10 rounded-full"
          aria-label="שלח"
        >
          <SendHorizonal className="size-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="כתוב את שאלתך כאן..."
          disabled={disabled}
          rows={1}
          className="resize-none min-h-10 max-h-36 flex-1 rounded-2xl leading-relaxed"
          style={{ overflowY: value.split('\n').length > 3 ? 'auto' : 'hidden' }}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">
        לחץ Enter לשליחה • Shift+Enter לשורה חדשה
      </p>
    </div>
  )
}
