'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Dumbbell, Github, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="ТренерБот — на главную"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Dumbbell className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">ТренерБот</span>
            <span className="text-[11px] font-medium text-muted-foreground">
              Панель управления
            </span>
          </span>
        </Link>

        <Badge
          variant="secondary"
          className="ml-1 hidden bg-accent text-accent-foreground sm:inline-flex"
        >
          fitness sales bot
        </Badge>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            disabled={!mounted}
          >
            {mounted && isDark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link
              href="https://vercel.com/guides/grammy-bot"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="size-4" />
              <span>GitHub</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden" aria-label="GitHub">
            <Link
              href="https://vercel.com/guides/grammy-bot"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
