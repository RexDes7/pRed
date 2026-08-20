import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const users = await db.botUser.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      _count: { select: { orders: true, messages: true } },
    },
  })
  return NextResponse.json({ ok: true, users })
}
