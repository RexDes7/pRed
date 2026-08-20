// Formatting + label helpers for the trainer-bot dashboard.
// Prices are stored in kopecks (minor units). Divide by 100 for display.

export type ProductType = 'course' | 'service' | 'program'
export type OrderStatus = 'new' | 'paid' | 'fulfilled' | 'cancelled'

export function formatPrice(kopecks: number | null | undefined, currency = 'RUB'): string {
  const value = Number(kopecks || 0)
  const rubles = value / 100
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rubles)
  if (currency && currency.toUpperCase() === 'RUB') return `${formatted} ₽`
  if (currency && currency.toUpperCase() === 'USD') return `$${formatted}`
  if (currency && currency.toUpperCase() === 'EUR') return `€${formatted}`
  return `${formatted} ${currency}`
}

export function formatNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat('ru-RU').format(Number(n || 0))
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = typeof iso === 'string' ? new Date(iso) : iso
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return '—'
  }
}

export function formatDateShort(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = typeof iso === 'string' ? new Date(iso) : iso
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(d)
  } catch {
    return '—'
  }
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  course: 'Курс',
  service: 'Услуга',
  program: 'Программа',
}

export const PRODUCT_TYPE_LABELS_PLURAL: Record<ProductType, string> = {
  course: 'Курсы',
  service: 'Услуги',
  program: 'Программы',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: '🆕 Ожидает оплаты',
  paid: '💳 Оплачен',
  fulfilled: '✅ Выполнен',
  cancelled: '❌ Отменён',
}

export const ORDER_STATUS_SHORT: Record<OrderStatus, string> = {
  new: 'Ожидает оплаты',
  paid: 'Оплачен',
  fulfilled: 'Выполнен',
  cancelled: 'Отменён',
}

export function shortId(id: string | null | undefined): string {
  if (!id) return '—'
  return (id.slice(-6) || '').toUpperCase()
}

export function featuresToList(features?: string | null): string[] {
  if (!features) return []
  return features
    .split('|')
    .map((f) => f.trim())
    .filter(Boolean)
}

export function listToFeatures(list: string[]): string {
  return list.filter(Boolean).join('|')
}

// Generic fetch helper that unwraps { ok, ... } payloads and throws on errors.
export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  let payload: unknown = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }
  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as Record<string, unknown>).error)
        : null) || `HTTP ${res.status}`
    throw new Error(message)
  }
  if (payload && typeof payload === 'object' && 'ok' in payload) {
    const obj = payload as Record<string, unknown>
    if (obj.ok === false) {
      throw new Error(String(obj.error || 'Ошибка запроса'))
    }
  }
  return payload as T
}
