import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifyUser, escapeMarkdown, formatPrice } from '@/lib/telegram/bot'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = ['new', 'paid', 'fulfilled', 'cancelled']

/** Build a customer-facing notification for a status change. Empty string = no notification. */
function buildStatusNotification(
  status: string,
  shortId: string,
  productTitle: string,
  amount: number,
  currency: string,
): string {
  const title = escapeMarkdown(productTitle)
  const sum = formatPrice(amount, currency)
  switch (status) {
    case 'paid':
      return (
        `💳 *Оплата подтверждена!*\n\n` +
        `Заказ #${shortId} — ${title}\n` +
        `Сумма: ${sum}\n\n` +
        `Тренер подтвердил получение оплаты. С вами свяжутся по следующим шагам.`
      )
    case 'cancelled':
      return (
        `❌ *Заказ отменён*\n\n` +
        `Заказ #${shortId} — ${title}\n` +
        `Сумма: ${sum}\n\n` +
        `К сожалению, заказ отменён тренером. Если есть вопросы — нажмите «Поддержка» в меню бота.`
      )
    case 'fulfilled':
      return (
        `✅ *Заказ выполнен!*\n\n` +
        `Заказ #${shortId} — ${title}\n\n` +
        `Спасибо за доверие! Будем рады видеть вас снова 🙌`
      )
    default:
      return ''
  }
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
  let newStatus: string | null = null
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(String(body.status))) {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
    }
    data.status = String(body.status)
    newStatus = String(body.status)
  }
  if (body.customerNote !== undefined) {
    data.customerNote = body.customerNote ? String(body.customerNote) : null
  }

  try {
    const order = await db.order.update({
      where: { id },
      data,
      include: { product: true, user: true },
    })

    // Notify the customer when the status changes to a meaningful one.
    let notify: { ok: boolean; error?: string } | null = null
    if (newStatus) {
      const shortId = order.id.slice(-6).toUpperCase()
      const msg = buildStatusNotification(
        newStatus,
        shortId,
        order.product.title,
        order.amount,
        order.product.currency,
      )
      if (msg) {
        // Don't let a notification failure fail the whole PATCH.
        try {
          notify = await notifyUser(order.userId, msg)
        } catch (e) {
          notify = { ok: false, error: (e as Error).message }
        }
      }
    }

    return NextResponse.json({ ok: true, order, notify })
  } catch {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
}
