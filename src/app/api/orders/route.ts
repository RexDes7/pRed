import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status && ['new', 'paid', 'fulfilled', 'cancelled'].includes(status)) {
    where.status = status
  }

  const orders = await db.order.findMany({
    where,
    include: {
      product: { select: { title: true, currency: true, type: true } },
      user: { select: { firstName: true, lastName: true, username: true, telegramId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ ok: true, orders })
}
