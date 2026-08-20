import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!['new', 'paid', 'fulfilled', 'cancelled'].includes(String(body.status))) {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
    }
    data.status = String(body.status)
  }
  if (body.customerNote !== undefined) {
    data.customerNote = body.customerNote ? String(body.customerNote) : null
  }

  try {
    const order = await db.order.update({ where: { id }, data, include: { product: true, user: true } })
    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
}
