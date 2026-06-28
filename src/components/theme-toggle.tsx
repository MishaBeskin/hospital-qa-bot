'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // next-themes requires a mounted guard to avoid SSR/client theme mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="size-8" />

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`relative size-8 ${className ?? ''}`}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
