'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, BarChart3, LogOut, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/admin/qa', label: 'ניהול שאלות ותשובות', icon: MessageSquare },
  { href: '/admin/stats', label: 'סטטיסטיקות', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar border-s border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <Stethoscope className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-sidebar-foreground leading-tight">
            עוזר HR
          </p>
          <p className="text-xs text-muted-foreground truncate">פאנל ניהול</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/admin/qa'
              ? pathname.startsWith('/admin/qa')
              : pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Logout */}
      <div className="px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            // Supabase signOut will go here
            window.location.href = '/admin'
          }}
        >
          <LogOut className="size-4 shrink-0" />
          התנתק
        </Button>
      </div>
    </aside>
  )
}
