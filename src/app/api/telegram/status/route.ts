import { NextResponse } from 'next/server'
import {
  getBotInfo,
  getWebhookInfo,
  isBotConfigured,
} from '@/lib/telegram/bot'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const configured = isBotConfigured()
  const settings = await db.botSettings.findUnique({ where: { id: 'default' } })

  if (!configured) {
    return NextResponse.json({
      ok: true,
      configured: false,
      settings: {
        webhookUrl: settings?.webhookUrl || null,
        botUsername: settings?.botUsername || null,
      },
    })
  }

  let botInfo: Awaited<ReturnType<typeof getBotInfo>> | null = null
  let webhookInfo: Awaited<ReturnType<typeof getWebhookInfo>> | null = null
  try {
    botInfo = await getBotInfo()
  } catch (e) {
    console.error('[telegram status] getMe failed', e)
  }
  try {
    webhookInfo = await getWebhookInfo()
  } catch (e) {
    console.error('[telegram status] getWebhookInfo failed', e)
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    bot: botInfo,
    webhook: webhookInfo,
    settings: {
      webhookUrl: settings?.webhookUrl || null,
      botUsername: settings?.botUsername || null,
    },
  })
}
