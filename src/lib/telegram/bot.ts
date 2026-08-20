import { Bot, InlineKeyboard } from 'grammy'
import type { Update } from 'grammy'
import { db } from '@/lib/db'

export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

let botInstance: Bot | null = null
// grammY requires `bot.init()` (which calls getMe) before `bot.handleUpdate()`
// because it needs the bot's username to detect commands like /start.
// We cache the init promise so warm invocations on Vercel reuse it.
let botInitPromise: Promise<void> | null = null

export function getBot(): Bot | null {
  if (!BOT_TOKEN) return null
  if (!botInstance) {
    botInstance = new Bot(BOT_TOKEN)
    registerHandlers(botInstance)
  }
  return botInstance
}

export function isBotConfigured(): boolean {
  return Boolean(BOT_TOKEN)
}

/** Lazily initialize the bot (fetches bot info via getMe). Cached per process. */
export async function ensureBotInit(): Promise<void> {
  const bot = getBot()
  if (!bot) return
  if (!botInitPromise) {
    botInitPromise = bot.init().catch((e) => {
      // Reset so the next call can retry
      botInitPromise = null
      throw e
    })
  }
  await botInitPromise
}

/* ----------------------------- markdown + base url helpers ----------------------------- */

/** Escape special characters for Telegram legacy Markdown (parse_mode: 'Markdown').
 * User-provided text (contactInfo, trainerName, product title, etc.) can contain
 * `_`, `*`, `[`, `]`, `` ` `` which break Markdown parsing and make the bot silently
 * fail to answer. */
export function escapeMarkdown(text: string | null | undefined): string {
  if (!text) return ''
  return String(text).replace(/([_*[\]`])/g, '\\$1')
}

// Set per-request from the webhook route so photos resolve to absolute URLs even
// when NEXT_PUBLIC_APP_URL is not configured on Vercel.
let currentBaseUrl = ''

export function setBaseUrl(url: string): void {
  currentBaseUrl = url ? url.replace(/\/$/, '') : ''
}

/* ----------------------------- helpers ----------------------------- */

const TYPE_LABELS: Record<string, string> = {
  course: 'Курсы',
  service: 'Услуги',
  program: 'Программы',
}

const STATUS_LABELS: Record<string, string> = {
  new: '🆕 Ожидает оплаты',
  paid: '💳 Оплачен',
  fulfilled: '✅ Выполнен',
  cancelled: '❌ Отменён',
}

export function formatPrice(price: number, currency: string): string {
  const value = (price / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: price % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
  return `${value} ${currency === 'RUB' ? '₽' : currency}`
}

function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text('🛒 Каталог', 'cat:start')
    .text('📦 Мои заказы', 'myorders')
    .row()
    .text('💪 О тренере', 'about')
    .text('💬 Поддержка', 'support')
}

type Ctx = Parameters<Parameters<Bot['command']>[0]>[0]

async function saveUser(ctx: Ctx) {
  const from = ctx.from
  if (!from) return null
  return db.botUser.upsert({
    where: { telegramId: String(from.id) },
    create: {
      telegramId: String(from.id),
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
    },
    update: {
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
    },
  })
}

async function getSettings() {
  return db.botSettings.findUnique({ where: { id: 'default' } })
}

/**
 * Telegram requires absolute public URLs for photos.
 * Relative paths (served from /public on Vercel) are resolved using the
 * per-request base URL (set by webhook route) or the NEXT_PUBLIC_APP_URL env var.
 */
function resolvePhotoUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  const base =
    currentBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    ''
  if (!base) return null
  return `${base.replace(/\/$/, '')}${imageUrl}`
}

/* ----------------------------- handlers ----------------------------- */

function registerHandlers(bot: Bot) {
  bot.command('start', async (ctx) => {
    const user = await saveUser(ctx)
    const settings = await getSettings()
    const text =
      `👋 Здравствуйте!\n\n${settings?.welcomeText || 'Добро пожаловать!'}\n\n` +
      `Я помогу вам выбрать курс, услугу или программу тренировок. Выберите раздел 👇`
    await ctx.reply(text, { reply_markup: mainMenuKeyboard() })
    if (user) {
      await db.message.create({
        data: { userId: user.id, direction: 'out', text },
      })
    }
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      'ℹ️ Бот тренера — автоматизация продаж.\n\n' +
        '• 🛒 Каталог — курсы, услуги, программы\n' +
        '• 📦 Мои заказы — история ваших покупок\n' +
        '• 💪 О тренере — информация и регалии\n' +
        '• 💬 Поддержка — связь с тренером\n\n' +
        'Чтобы сделать заказ: откройте каталог → выберите товар → нажмите «Заказать».',
      { reply_markup: mainMenuKeyboard() },
    )
  })

  // ---------- main menu ----------
  bot.callbackQuery('menu', async (ctx) => {
    const settings = await getSettings()
    const text = `${settings?.welcomeText || 'Главное меню'}\n\nВыберите раздел 👇`
    await ctx.reply(text, { reply_markup: mainMenuKeyboard() })
    await ctx.answerCallbackQuery()
  })

  // ---------- catalog root ----------
  bot.callbackQuery('cat:start', async (ctx) => {
    const kb = new InlineKeyboard()
      .text('🎓 Курсы', 'cat:course')
      .text('🤝 Услуги', 'cat:service')
      .row()
      .text('📋 Программы', 'cat:program')
      .row()
      .text('🏠 В меню', 'menu')
    await ctx.reply('🛒 *Каталог*\n\nВыберите категорию:', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    })
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery(/^cat:(course|service|program)$/, async (ctx) => {
    const type = ctx.match![1]
    const products = await db.product.findMany({
      where: { type, active: true },
      orderBy: { price: 'asc' },
    })
    if (products.length === 0) {
      await ctx.answerCallbackQuery({ text: 'В этой категории пока нет товаров' })
      return
    }
    const kb = new InlineKeyboard()
    for (const p of products) {
      kb
        .text(
          `${p.title} — ${formatPrice(p.price, p.currency)}`,
          `prod:${p.id}`,
        )
        .row()
    }
    kb.text('⬅️ К категориям', 'cat:start').text('🏠 В меню', 'menu')
    await ctx.reply(`📚 *${TYPE_LABELS[type]}* (${products.length})\n\nВыберите товар:`, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    })
    await ctx.answerCallbackQuery()
  })

  // ---------- product detail ----------
  bot.callbackQuery(/^prod:([A-Za-z0-9_-]+)$/, async (ctx) => {
    const id = ctx.match![1]
    const product = await db.product.findUnique({ where: { id } })
    if (!product || !product.active) {
      await ctx.answerCallbackQuery({ text: 'Товар не найден' })
      return
    }
    const features = product.features
      ? product.features
          .split('|')
          .map((f) => `✅ ${escapeMarkdown(f)}`)
          .join('\n')
      : ''
    const caption =
      `*${escapeMarkdown(product.title)}*\n\n` +
      `${escapeMarkdown(product.description)}\n\n` +
      `⏱ Длительность: ${escapeMarkdown(product.duration || '—')}\n` +
      `💵 Стоимость: *${formatPrice(product.price, product.currency)}*\n` +
      (features ? `\n${features}\n` : '')
    const kb = new InlineKeyboard()
      .text('🛒 Заказать', `order:${product.id}`)
      .row()
      .text('⬅️ К категории', `cat:${product.type}`)
      .text('🏠 В меню', 'menu')

    const photoUrl = resolvePhotoUrl(product.imageUrl)
    try {
      if (photoUrl) {
        await ctx.replyWithPhoto(photoUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: kb,
        })
      } else {
        await ctx.reply(caption, { parse_mode: 'Markdown', reply_markup: kb })
      }
    } catch {
      await ctx.reply(caption, { parse_mode: 'Markdown', reply_markup: kb })
    }
    await ctx.answerCallbackQuery()
  })

  // ---------- order: confirm ----------
  bot.callbackQuery(/^order:([A-Za-z0-9_-]+)$/, async (ctx) => {
    const id = ctx.match![1]
    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      await ctx.answerCallbackQuery({ text: 'Товар не найден' })
      return
    }
    const kb = new InlineKeyboard()
      .text('✅ Подтвердить заказ', `confirm:${product.id}`)
      .row()
      .text('⬅️ Назад', `prod:${product.id}`)
      .text('🏠 В меню', 'menu')
    const text =
      `🧾 *Оформление заказа*\n\n` +
      `${escapeMarkdown(product.title)}\n` +
      `Сумма: *${formatPrice(product.price, product.currency)}*\n\n` +
      `Нажмите «Подтвердить заказ» — мы создадим заказ и пришлём реквизиты.`
    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb })
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery(/^confirm:([A-Za-z0-9_-]+)$/, async (ctx) => {
    const id = ctx.match![1]
    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      await ctx.answerCallbackQuery({ text: 'Товар не найден' })
      return
    }
    const user = await saveUser(ctx)
    if (!user) {
      await ctx.answerCallbackQuery({ text: 'Ошибка пользователя' })
      return
    }
    const order = await db.order.create({
      data: {
        userId: user.id,
        productId: product.id,
        amount: product.price,
        status: 'new',
      },
    })
    const settings = await getSettings()
    const shortId = order.id.slice(-6).toUpperCase()
    const text =
      `✅ *Заказ #${shortId} создан!*\n\n` +
      `${escapeMarkdown(product.title)}\n` +
      `Сумма: ${formatPrice(product.price, product.currency)}\n\n` +
      `${escapeMarkdown(settings?.paymentInfo || 'Реквизиты для оплаты будут высланы отдельно.')}\n\n` +
      `После оплаты пришлите чек сообщением сюда. Статус заказа можно посмотреть в «Мои заказы».`
    const kb = new InlineKeyboard()
      .text('📦 Мои заказы', 'myorders')
      .text('🏠 В меню', 'menu')
    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: kb })
    await ctx.answerCallbackQuery({ text: 'Заказ создан ✅' })

    // notify admin
    if (settings?.adminChatId) {
      try {
        const fullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(' ')
        const clientLine = fullName
          ? `👤 Клиент: ${fullName} (@${user.username || '—'})`
          : `👤 Клиент: @${user.username || '—'}`
        await bot.api.sendMessage(
          settings.adminChatId,
          `🔔 *Новый заказ #${shortId}*\n\n` +
            `${clientLine}\n` +
            `🛒 Товар: ${escapeMarkdown(product.title)}\n` +
            `💵 Сумма: ${formatPrice(product.price, product.currency)}\n` +
            `📅 ${new Date().toLocaleString('ru-RU')}`,
          { parse_mode: 'Markdown' },
        )
      } catch {
        // ignore notify errors
      }
    }
  })

  // ---------- my orders ----------
  bot.callbackQuery('myorders', async (ctx) => {
    const user = await saveUser(ctx)
    if (!user) {
      await ctx.answerCallbackQuery()
      return
    }
    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    if (orders.length === 0) {
      const kb = new InlineKeyboard()
        .text('🛒 В каталог', 'cat:start')
        .text('🏠 В меню', 'menu')
      await ctx.reply(
        '📦 У вас пока нет заказов.\n\nЗагляните в каталог — поможем выбрать!',
        { reply_markup: kb },
      )
      await ctx.answerCallbackQuery()
      return
    }
    const lines = orders
      .map((o) => {
        const shortId = o.id.slice(-6).toUpperCase()
        return `#${shortId} • ${escapeMarkdown(o.product.title)}\n   ${formatPrice(
          o.amount,
          o.product.currency,
        )} — ${STATUS_LABELS[o.status] || o.status}`
      })
      .join('\n\n')
    const kb = new InlineKeyboard().text('🏠 В меню', 'menu')
    await ctx.reply(`📦 *Ваши заказы* (последние ${orders.length})\n\n${lines}`, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    })
    await ctx.answerCallbackQuery()
  })

  // ---------- about ----------
  bot.callbackQuery('about', async (ctx) => {
    const settings = await getSettings()
    const kb = new InlineKeyboard().text('🏠 В меню', 'menu')
    await ctx.reply(
      `💪 *${escapeMarkdown(settings?.trainerName || 'Тренер')}*\n\n${escapeMarkdown(settings?.aboutText || '')}`,
      { parse_mode: 'Markdown', reply_markup: kb },
    )
    await ctx.answerCallbackQuery()
  })

  // ---------- support ----------
  bot.callbackQuery('support', async (ctx) => {
    const settings = await getSettings()
    const kb = new InlineKeyboard().text('🏠 В меню', 'menu')
    // Escape user-provided contactInfo — `_` in usernames like @rlc_w would break Markdown
    await ctx.reply(
      `💬 *Поддержка*\n\n${escapeMarkdown(settings?.contactInfo || 'Свяжитесь с нами в Telegram.')}`,
      { parse_mode: 'Markdown', reply_markup: kb },
    )
    await ctx.answerCallbackQuery()
  })

  // ---------- text fallback ----------
  bot.on('message:text', async (ctx) => {
    const user = await saveUser(ctx)
    if (user) {
      await db.message.create({
        data: { userId: user.id, direction: 'in', text: ctx.message.text },
      })
    }
    const replyText =
      'Спасибо за сообщение! Я получил его и отвечу в рабочее время.\n\n' +
      'А пока — воспользуйтесь меню, чтобы выбрать курс или услугу 👇'
    await ctx.reply(replyText, { reply_markup: mainMenuKeyboard() })
    if (user) {
      await db.message.create({
        data: { userId: user.id, direction: 'out', text: replyText },
      })
    }
  })
}

/* ----------------------------- public API ----------------------------- */

export async function handleUpdate(update: Update, baseUrl?: string): Promise<void> {
  const bot = getBot()
  if (!bot) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  // Per-request base URL so photos resolve even without NEXT_PUBLIC_APP_URL.
  if (baseUrl) setBaseUrl(baseUrl)
  // grammY requires the bot to be initialized (getMe called) before
  // handleUpdate, otherwise it throws "Bot not initialized!".
  await ensureBotInit()
  await bot.handleUpdate(update)
}

export async function setWebhookUrl(url: string) {
  const bot = getBot()
  if (!bot) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  await bot.api.setWebhook(url, { drop_pending_updates: true })
  await db.botSettings.update({
    where: { id: 'default' },
    data: { webhookUrl: url },
  })
  return { ok: true, url }
}

export async function deleteWebhookUrl() {
  const bot = getBot()
  if (!bot) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  await bot.api.deleteWebhook({ drop_pending_updates: true })
  await db.botSettings.update({
    where: { id: 'default' },
    data: { webhookUrl: null },
  })
  return { ok: true }
}

export async function getBotInfo() {
  const bot = getBot()
  if (!bot) return null
  const info = await bot.api.getMe()
  await db.botSettings.update({
    where: { id: 'default' },
    data: { botUsername: info.username },
  })
  return info
}

export async function getWebhookInfo() {
  const bot = getBot()
  if (!bot) return null
  return bot.api.getWebhookInfo()
}

export async function setBotCommands() {
  const bot = getBot()
  if (!bot) return
  await bot.api.setMyCommands([
    { command: 'start', description: 'Запустить бота / главное меню' },
    { command: 'help', description: 'Помощь по боту' },
  ])
}

export async function broadcastMessage(
  text: string,
): Promise<{ sent: number; failed: number }> {
  const bot = getBot()
  if (!bot) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  const users = await db.botUser.findMany({ select: { telegramId: true, id: true } })
  let sent = 0
  let failed = 0
  for (const u of users) {
    try {
      await bot.api.sendMessage(u.telegramId, text)
      await db.message.create({
        data: { userId: u.id, direction: 'out', text },
      })
      sent += 1
    } catch {
      failed += 1
    }
    await new Promise((r) => setTimeout(r, 50))
  }
  return { sent, failed }
}

/** Send a message to a single bot user (by internal userId). Used by the admin
 * dashboard to notify customers about order status changes (paid / cancelled). */
export async function notifyUser(
  userId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const bot = getBot()
  if (!bot) return { ok: false, error: 'bot not configured' }
  const user = await db.botUser.findUnique({
    where: { id: userId },
    select: { telegramId: true, id: true },
  })
  if (!user) return { ok: false, error: 'user not found' }
  try {
    await bot.api.sendMessage(user.telegramId, text, { parse_mode: 'Markdown' })
    await db.message.create({
      data: { userId: user.id, direction: 'out', text },
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
