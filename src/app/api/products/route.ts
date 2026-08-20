import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const active = searchParams.get('active')

  const where: Record<string, unknown> = {}
  if (type && ['course', 'service', 'program'].includes(type)) {
    where.type = type
  }
  if (active === 'true') where.active = true
  if (active === 'false') where.active = false

  const products = await db.product.findMany({
    where,
    orderBy: [{ type: 'asc' }, { price: 'asc' }],
  })
  return NextResponse.json({ ok: true, products })
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const type = String(body.type || '')
  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  const price = Number(body.price)
  const currency = String(body.currency || 'RUB')
  const duration = body.duration ? String(body.duration) : null
  const imageUrl = body.imageUrl ? String(body.imageUrl) : null
  const features = body.features ? String(body.features) : null
  const active = body.active !== false

  if (!['course', 'service', 'program'].includes(type)) {
    return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })
  }
  if (!title) {
    return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 })
  }
  if (!description) {
    return NextResponse.json({ ok: false, error: 'description is required' }, { status: 400 })
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ ok: false, error: 'Invalid price' }, { status: 400 })
  }

  const product = await db.product.create({
    data: {
      type,
      title,
      description,
      price: Math.round(price),
      currency,
      duration,
      imageUrl,
      features,
      active,
    },
  })
  return NextResponse.json({ ok: true, product }, { status: 201 })
}
