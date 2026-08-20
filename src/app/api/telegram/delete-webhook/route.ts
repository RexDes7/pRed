import { NextResponse } from 'next/server'
import { deleteWebhookUrl, isBotConfigured } from '@/lib/telegram/bot'

export const runtime = 'nodejs'

export async function POST() {
  if (!isBotConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' },
      { status: 503 },
    )
  }
  try {
    const result = await deleteWebhookUrl()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'deleteWebhook failed' },
      { status: 500 },
    )
  }
}
