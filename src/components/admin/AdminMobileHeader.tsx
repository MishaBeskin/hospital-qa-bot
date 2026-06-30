'use client'

import { useState } from 'react'
import { Menu, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SidebarContent } from './AdminSidebar'

export function AdminMobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-sidebar shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-sidebar-foreground"
        onClick={() => setOpen(true)}
        aria-label="פתח תפריט"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex items-center gap-2 min-w-0">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
          <Stethoscope className="size-4" />
        </div>
        <span className="font-semibold text-sm text-sidebar-foreground truncate">
          עוזר HR — פאנל ניהול
        </span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64 p-0 border-e border-sidebar-border">
          <SheetTitle className="sr-only">תפריט ניהול</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
