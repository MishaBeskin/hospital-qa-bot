'use client'

import { useState } from 'react'
import { Stethoscope, SquarePen, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChatWindow } from './ChatWindow'

export function ChatScreen() {
  const [chatKey, setChatKey] = useState(0)

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="shrink-0 border-b border-border bg-card z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Stethoscope className="size-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground leading-tight truncate">
                עוזר HR
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                בית החולים — מחלקת משאבי אנוש
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* New chat */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setChatKey((k) => k + 1)}
              aria-label="התחל שיחה חדשה"
            >
              <SquarePen className="size-4" />
              <span className="hidden sm:inline text-sm">שיחה חדשה</span>
            </Button>

            <ThemeToggle className="text-muted-foreground/40 hover:text-muted-foreground" />

            {/* Admin link — subtle, for staff only */}
            <Link
              href="/admin/login"
              className="flex items-center justify-center size-8 rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="כניסת מנהל"
            >
              <Settings className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <ChatWindow key={chatKey} />
      </div>
    </div>
  )
}
