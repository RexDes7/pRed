'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCheck,
  ChevronLeft,
  Dumbbell,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Send,
  ShoppingBag,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ProductImage } from '@/components/dashboard/product-image'
import {
  apiFetch,
  featuresToList,
  formatPrice,
  PRODUCT_TYPE_LABELS,
} from '@/lib/format'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  type: 'course' | 'service' | 'program'
  title: string
  description: string
  price: number
  currency: string
  duration: string | null
  imageUrl: string | null
  features: string | null
  active: boolean
}

export function BotPreview() {
  const query = useQuery<Product[]>({
    queryKey: ['products', 'preview'],
    queryFn: async () => {
      const res = await apiFetch<{ products: Product[] }>('/api/products?active=true')
      return res.products
    },
  })

  const sample = query.data?.[0] || null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-primary" />
            Превью чата с ботом
          </CardTitle>
          <CardDescription>
            Так видят бота клиенты в Telegram. Карточка товара берётся из каталога (первый активный).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <PhoneFrame>
              <ChatHeader username="ТренерБот" />
              <ChatBody sample={sample} loading={query.isLoading} />
              <ChatInput />
            </PhoneFrame>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[360px] rounded-[2.2rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl dark:border-neutral-800">
      {/* notch */}
      <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-neutral-900 dark:bg-neutral-800" />
      <div className="overflow-hidden rounded-[1.4rem] bg-white dark:bg-neutral-950">
        {children}
      </div>
    </div>
  )
}

function ChatHeader({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-black/5 bg-[#517da2] px-3 py-2 text-white dark:bg-[#2b5278]">
      <button
        className="flex size-7 items-center justify-center rounded-full hover:bg-white/10"
        aria-label="Назад"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div className="flex size-9 items-center justify-center rounded-full bg-white/15">
        <Dumbbell className="size-5" />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{username}</p>
        <p className="text-[11px] text-white/70">бот</p>
      </div>
      <button className="flex size-7 items-center justify-center rounded-full hover:bg-white/10" aria-label="Меню">
        <MoreVertical className="size-5" />
      </button>
    </div>
  )
}

function ChatBody({
  sample,
  loading,
}: {
  sample: Product | null
  loading: boolean
}) {
  return (
    <div className="tg-chat-bg scrollbar-emerald h-[460px] space-y-2 overflow-y-auto p-3">
      {/* Date divider */}
      <div className="flex justify-center py-1">
        <span className="rounded-2xl bg-black/15 px-2 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/70">
          сегодня
        </span>
      </div>

      {/* Welcome bubble (outgoing from bot = appears on left as bot) */}
      <div className="flex justify-start">
        <div className="tg-bubble-in max-w-[85%] px-3 py-2 text-sm shadow-sm">
          <p className="font-semibold text-[#1c7ed6]">Привет! 👋</p>
          <p className="mt-0.5">
            Я тренер по фитнесу. Помогу тебе выбрать курс, услугу или программу
            тренировок. Выбери действие ниже 👇
          </p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-black/40 dark:text-white/40">
            12:00
          </div>
        </div>
      </div>

      {/* Inline keyboard as a special bubble */}
      <div className="flex justify-start">
        <div className="tg-bubble-in w-[85%] p-2 shadow-sm">
          <p className="px-1 pb-1 text-xs text-black/60 dark:text-white/60">
            Главное меню
          </p>
          <div className="tg-keyboard grid grid-cols-2 gap-1.5">
            <button className="px-2 py-1.5 text-xs">🏋 Каталог</button>
            <button className="px-2 py-1.5 text-xs">🛒 Мои заказы</button>
            <button className="px-2 py-1.5 text-xs">👤 О тренере</button>
            <button className="px-2 py-1.5 text-xs">💬 Поддержка</button>
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-black/40 dark:text-white/40">
            12:00
          </div>
        </div>
      </div>

      {/* Sample product card */}
      {loading ? (
        <div className="flex justify-start">
          <div className="tg-bubble-in w-[85%] p-2 shadow-sm">
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-1 h-3 w-full" />
          </div>
        </div>
      ) : sample ? (
        <div className="flex justify-start">
          <div className="tg-bubble-in w-[85%] p-2 shadow-sm">
            <ProductImage
              src={sample.imageUrl}
              alt={sample.title}
              className="aspect-video w-full rounded-md"
            />
            <div className="px-1 pb-1 pt-2">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded bg-[#1c7ed6]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#1c7ed6] dark:text-[#6cb2f0]">
                  {PRODUCT_TYPE_LABELS[sample.type]}
                </span>
                {sample.duration ? (
                  <span className="text-[10px] text-black/50 dark:text-white/50">
                    {sample.duration}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-semibold leading-snug">{sample.title}</p>
              <p className="mt-0.5 line-clamp-3 text-xs text-black/60 dark:text-white/60">
                {sample.description}
              </p>
              {featuresToList(sample.features).length > 0 ? (
                <ul className="mt-1.5 space-y-0.5 text-[11px] text-black/70 dark:text-white/70">
                  {featuresToList(sample.features)
                    .slice(0, 3)
                    .map((f) => (
                      <li key={f} className="flex items-center gap-1">
                        <span className="text-[#1c7ed6] dark:text-[#6cb2f0]">✓</span>
                        {f}
                      </li>
                    ))}
                </ul>
              ) : null}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-bold">{formatPrice(sample.price, sample.currency)}</span>
                <span className="rounded-md bg-[#1c7ed6] px-3 py-1 text-xs font-semibold text-white dark:bg-[#2b5278]">
                  Заказать
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 px-1 text-[10px] text-black/40 dark:text-white/40">
              12:01
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-4">
          <span className="rounded-2xl bg-black/10 px-3 py-1 text-[11px] text-black/60 dark:bg-white/10 dark:text-white/70">
            Добавьте товар в каталог, чтобы увидеть карточку здесь
          </span>
        </div>
      )}

      {/* user reply on right */}
      <div className="flex justify-end">
        <div className="tg-bubble-out max-w-[70%] px-3 py-2 text-sm shadow-sm">
          Заказать
          <span className="ml-1 inline-flex items-center gap-0.5 align-middle text-[10px] text-black/40 dark:text-white/50">
            12:02
            <CheckCheck className="size-3" />
          </span>
        </div>
      </div>

      {/* bot confirmation */}
      <div className="flex justify-start">
        <div className="tg-bubble-in max-w-[85%] px-3 py-2 text-sm shadow-sm">
          <p>Заказ оформлен ✅</p>
          <p className="mt-0.5 text-xs text-black/70 dark:text-white/70">
            Сумма: {sample ? formatPrice(sample.price, sample.currency) : '—'}. Оплатите и пришлите чек, после чего администратор подтвердит заказ.
          </p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-black/40 dark:text-white/40">
            12:02
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatInput() {
  return (
    <div className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-2 dark:bg-neutral-900 dark:border-white/5">
      <button
        className="flex size-8 items-center justify-center rounded-full text-[#1c7ed6] hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Прикрепить"
      >
        <Paperclip className="size-5" />
      </button>
      <div className="flex flex-1 items-center rounded-full bg-[#f0f3f5] px-3 py-2 text-sm text-black/40 dark:bg-neutral-800 dark:text-white/40">
        Сообщение
      </div>
      <button
        className="flex size-9 items-center justify-center rounded-full bg-[#1c7ed6] text-white dark:bg-[#2b5278]"
        aria-label="Отправить"
      >
        <Send className="size-4" />
      </button>
    </div>
  )
}
