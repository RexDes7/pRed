import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  let settings = await db.botSettings.findUnique({ where: { id: 'default' } })
  if (!settings) {
    settings = await db.botSettings.create({ data: { id: 'default' } })
  }
  return NextResponse.json({ ok: true, settings })
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  for (const key of [
    'trainerName',
    'welcomeText',
    'aboutText',
    'paymentInfo',
    'contactInfo',
    'adminChatId',
    'botUsername',
  ]) {
    if (body[key] !== undefined) data[key] = String(body[key])
  }

  const settings = await db.botSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...(data as Record<string, string>) },
  })
  return NextResponse.json({ ok: true, settings })
}
