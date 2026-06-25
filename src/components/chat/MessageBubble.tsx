import { cn } from '@/lib/utils'
import { MediaViewer } from './MediaViewer'
import type { ChatMessage } from '@/types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full',
        // In RTL: justify-start = right side, justify-end = left side
        isUser ? 'justify-start' : 'justify-end',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-se-sm'
            : 'bg-card border border-border text-foreground rounded-ss-sm',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.media && message.media.length > 0 && (
          <MediaViewer media={message.media} />
        )}
      </div>
    </div>
  )
}
