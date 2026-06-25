'use client'

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react'
import { SendHorizonal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

const MAX_HEIGHT = 144 // ~6 lines

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    resize(e.target)
  }

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = !!value.trim() && !disabled

  return (
    <div className="border-t border-border bg-background px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        {/* Send button — placed first in DOM; visually appears on left in RTL */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 size-10 rounded-full transition-opacity"
          aria-label="שלח הודעה"
        >
          <SendHorizonal className="size-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="כתוב את שאלתך כאן..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-2xl leading-relaxed min-h-10 overflow-hidden transition-[height]"
          style={{ maxHeight: MAX_HEIGHT }}
          aria-label="הודעה"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground/60 mt-2">
        Enter לשליחה &nbsp;·&nbsp; Shift+Enter לשורה חדשה
      </p>
    </div>
  )
}
