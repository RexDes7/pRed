import { NextResponse } from 'next/server'
import { setWebhookUrl, setBotCommands, getBotInfo, isBotConfigured } from '@/lib/telegram/bot'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!isBotConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' },
      { status: 503 },
    )
  }
  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const url = body.url?.trim()
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { ok: false, error: 'Valid url (https://...) is required' },
      { status: 400 },
    )
  }

  const base = url.replace(/\/$/, '')
  const fullUrl = `${base}/api/telegram/webhook`

  try {
    const result = await setWebhookUrl(fullUrl)
    try {
      await setBotCommands()
    } catch {
      /* non-fatal */
    }
    let info: Awaited<ReturnType<typeof getBotInfo>> | null = null
    try {
      info = await getBotInfo()
    } catch {
      /* non-fatal */
    }
    return NextResponse.json({ ok: true, ...result, bot: info })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'setWebhook failed' },
      { status: 500 },
    )
  }
}
