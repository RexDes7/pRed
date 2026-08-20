import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

const VALID_TYPES = ['card', 'phone', 'crypto', 'upi', 'other']

/** PATCH /api/payment-methods/[id] — update fields. */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.type !== undefined) {
    if (!VALID_TYPES.includes(String(body.type))) {
      return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })
    }
    data.type = String(body.type)
  }
  if (body.label !== undefined) data.label = String(body.label).trim()
  if (body.value !== undefined) data.value = String(body.value).trim()
  if (body.hint !== undefined) data.hint = body.hint ? String(body.hint) : null
  if (body.order !== undefined) data.order = Number(body.order) || 0
  if (body.active !== undefined) data.active = Boolean(body.active)

  try {
    const method = await db.paymentMethod.update({ where: { id }, data })
    return NextResponse.json({ ok: true, method })
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
}

/** DELETE /api/payment-methods/[id]. */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  try {
    await db.paymentMethod.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
}
