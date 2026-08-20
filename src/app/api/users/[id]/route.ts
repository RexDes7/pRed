import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const user = await db.botUser.findUnique({
    where: { id },
    include: {
      orders: {
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, user })
}
