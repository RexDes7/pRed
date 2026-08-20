import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, product })
}

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
    if (!['course', 'service', 'program'].includes(String(body.type))) {
      return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })
    }
    data.type = String(body.type)
  }
  if (body.title !== undefined) data.title = String(body.title)
  if (body.description !== undefined) data.description = String(body.description)
  if (body.price !== undefined) {
    const p = Number(body.price)
    if (!Number.isFinite(p) || p < 0) {
      return NextResponse.json({ ok: false, error: 'Invalid price' }, { status: 400 })
    }
    data.price = Math.round(p)
  }
  if (body.currency !== undefined) data.currency = String(body.currency)
  if (body.duration !== undefined) data.duration = body.duration ? String(body.duration) : null
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl ? String(body.imageUrl) : null
  if (body.features !== undefined) data.features = body.features ? String(body.features) : null
  if (body.active !== undefined) data.active = Boolean(body.active)

  try {
    const product = await db.product.update({ where: { id }, data })
    return NextResponse.json({ ok: true, product })
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  try {
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
}
