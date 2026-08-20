import { NextResponse } from 'next/server'
import { broadcastMessage, isBotConfigured } from '@/lib/telegram/bot'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!isBotConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' },
      { status: 503 },
    )
  }
  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
  const text = (body.text || '').trim()
  if (!text) {
    return NextResponse.json({ ok: false, error: 'text is required' }, { status: 400 })
  }
  try {
    const result = await broadcastMessage(text)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'broadcast failed' },
      { status: 500 },
    )
  }
}
