import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/** GET /api/messages — count of stored messages (for the dashboard badge). */
export async function GET() {
  try {
    const count = await db.message.count()
    return NextResponse.json({ ok: true, count })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/messages — clear stored conversation history (admin-side).
 *   ?full=true — also delete all orders and bot users (full reset).
 *
 * NOTE: this does NOT delete messages from the Telegram client app —
 * Telegram Bot API can only delete individual messages by message_id, and
 * the bot doesn't store outgoing message_ids. To start fresh, the user can
 * just write /start to the bot again.
 */
export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const full = url.searchParams.get('full') === 'true'

  try {
    if (full) {
      // Deleting BotUser cascades to Message and Order (per schema).
      const users = await db.botUser.deleteMany({})
      return NextResponse.json({
        ok: true,
        deleted: { users: users.count },
        note: 'Все пользователи, заказы и сообщения удалены.',
      })
    }
    const messages = await db.message.deleteMany({})
    return NextResponse.json({
      ok: true,
      deleted: { messages: messages.count },
      note: 'История переписки очищена. Заказы и клиенты сохранены.',
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    )
  }
}
