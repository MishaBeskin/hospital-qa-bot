import { cn } from '@/lib/utils'
import { MediaViewer } from './MediaViewer'
import type { ChatMessage } from '@/types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className={cn(
        'flex w-full',
        // RTL: justify-start = visually RIGHT, justify-end = visually LEFT
        isUser ? 'justify-start' : 'justify-end',
      )}
    >
      <div className={cn('flex flex-col max-w-[82%] sm:max-w-[70%]', isUser ? 'items-start' : 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-se-sm'
              : 'bg-card border border-border text-foreground rounded-ss-sm',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {!isUser && message.media && message.media.length > 0 && (
            <MediaViewer media={message.media} />
          )}
        </div>

        {time && (
          <span className="text-[10px] text-muted-foreground/60 mt-1 px-1 tabular-nums">
            {time}
          </span>
        )}
      </div>
    </div>
  )
}
