import Link from 'next/link'
import { Dumbbell, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div className="flex items-center gap-1.5">
          <Dumbbell className="size-3.5 text-primary" />
          <span>
            <span className="font-semibold text-foreground">ТренерБот</span> © 2025
          </span>
          <span className="text-muted-foreground/70">•</span>
          <span className="hidden sm:inline">
            GitHub + Vercel + Next.js + grammy
          </span>
          <span className="sm:hidden">GitHub · Vercel · Next.js · grammy</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="https://vercel.com/guides/grammy-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md font-medium text-primary hover:underline"
          >
            <Github className="size-3.5" />
            Гайд по деплою
          </Link>
        </div>
      </div>
    </footer>
  )
}
