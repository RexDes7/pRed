import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const VALID_TYPES = ['card', 'phone', 'crypto', 'upi', 'other']

/** GET /api/payment-methods?active=true — list payment methods (sorted by order). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const activeOnly = url.searchParams.get('active') === 'true'
  const methods = await db.paymentMethod.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ ok: true, methods })
}

/** POST /api/payment-methods — create a payment method. */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const type = String(body.type || 'card')
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })
  }
  const label = String(body.label || '').trim()
  const value = String(body.value || '').trim()
  if (!label || !value) {
    return NextResponse.json({ ok: false, error: 'label and value are required' }, { status: 400 })
  }

  const method = await db.paymentMethod.create({
    data: {
      type,
      label,
      value,
      hint: body.hint ? String(body.hint) : null,
      order: Number(body.order ?? 0) || 0,
      active: body.active !== undefined ? Boolean(body.active) : true,
    },
  })
  return NextResponse.json({ ok: true, method })
}
