import { Stethoscope } from 'lucide-react'
import { ChatWindow } from '@/components/chat/ChatWindow'

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Stethoscope className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              עוזר HR
            </h1>
            <p className="text-xs text-muted-foreground">בית החולים — מחלקת משאבי אנוש</p>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  )
}
