import { NextResponse } from 'next/server'
import { handleUpdate, isBotConfigured } from '@/lib/telegram/bot'

export const runtime = 'nodejs'
// Vercel serverless: allow up to 30s for update processing (Telegram retries on timeout)
export const maxDuration = 30

export async function POST(req: Request) {
  let update: unknown
  try {
    update = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isBotConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' },
      { status: 503 },
    )
  }

  // Resolve the public base URL so the bot can build absolute photo URLs
  // even when NEXT_PUBLIC_APP_URL is not configured on Vercel.
  const host =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  const proto = (req.headers.get('x-forwarded-proto') || 'https')
    .split(',')[0]
    .trim()
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '')

  try {
    await handleUpdate(
      update as Parameters<typeof handleUpdate>[0],
      baseUrl,
    )
  } catch (e) {
    console.error('[telegram webhook]', e)
    // Return 200 anyway so Telegram does not retry forever
    return NextResponse.json({ ok: false, error: 'handler error' })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isBotConfigured(),
    message: isBotConfigured()
      ? 'Telegram webhook endpoint is active. POST a Telegram Update here.'
      : 'Set TELEGRAM_BOT_TOKEN env var to activate the bot.',
  })
}
