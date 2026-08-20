'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Bot as BotIcon,
  CheckCircle2,
  Link2,
  Loader2,
  Megaphone,
  Plug,
  Send,
  Trash2,
  Webhook,
  XCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/format'

type BotStatus = {
  ok: boolean
  configured: boolean
  bot?: {
    id: number
    is_bot: boolean
    first_name: string
    username: string
  } | null
  webhook?: {
    url: string
    pending_update_count: number
    last_error_message: string | null
    has_custom_certificate: boolean
  } | null
  settings: {
    webhookUrl: string | null
    botUsername: string | null
  }
}

export function BotTab() {
  const qc = useQueryClient()
  const [baseUrl, setBaseUrl] = React.useState('')
  const [broadcast, setBroadcast] = React.useState('')

  const status = useQuery<BotStatus>({
    queryKey: ['telegram-status'],
    queryFn: () => apiFetch<BotStatus>('/api/telegram/status'),
  })

  const setWebhook = useMutation({
    mutationFn: (url: string) =>
      apiFetch<{ ok: boolean; url: string; bot?: BotStatus['bot'] }>(
        '/api/telegram/setwebhook',
        { method: 'POST', body: JSON.stringify({ url }) },
      ),
    onSuccess: (res) => {
      toast.success('Webhook установлен', {
        description: res.url,
      })
      qc.invalidateQueries({ queryKey: ['telegram-status'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (e: unknown) =>
      toast.error('Не удалось установить webhook', {
        description: (e as Error).message,
      }),
  })

  const deleteWebhook = useMutation({
    mutationFn: () =>
      apiFetch('/api/telegram/delete-webhook', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Webhook удалён')
      qc.invalidateQueries({ queryKey: ['telegram-status'] })
    },
    onError: (e: unknown) =>
      toast.error('Не удалось удалить webhook', {
        description: (e as Error).message,
      }),
  })

  const broadcastMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch<{ sent: number; failed: number }>('/api/telegram/broadcast', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: (res) => {
      toast.success('Рассылка отправлена', {
        description: `Доставлено: ${res.sent} · Ошибок: ${res.failed}`,
      })
      setBroadcast('')
    },
    onError: (e: unknown) =>
      toast.error('Рассылка не удалась', {
        description: (e as Error).message,
      }),
  })

  const [resetOpen, setResetOpen] = React.useState<'messages' | 'full' | null>(null)

  const clearMessages = useMutation({
    mutationFn: () =>
      apiFetch<{ deleted: { messages: number } }>('/api/messages', {
        method: 'DELETE',
      }),
    onSuccess: (res) => {
      toast.success('Переписка очищена', {
        description: `Удалено сообщений: ${res.deleted.messages}`,
      })
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setResetOpen(null)
    },
    onError: (e: unknown) =>
      toast.error('Не удалось очистить', {
        description: (e as Error).message,
      }),
  })

  const fullReset = useMutation({
    mutationFn: () =>
      apiFetch<{ deleted: { users: number } }>('/api/messages?full=true', {
        method: 'DELETE',
      }),
    onSuccess: (res) => {
      toast.success('Полный сброс выполнен', {
        description: `Удалено пользователей: ${res.deleted.users} (вместе с заказами и сообщениями)`,
      })
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setResetOpen(null)
    },
    onError: (e: unknown) =>
      toast.error('Не удалось выполнить сброс', {
        description: (e as Error).message,
      }),
  })

  const setWebhookUrl = status.data?.settings.webhookUrl
  const botUsername =
    status.data?.bot?.username || status.data?.settings.botUsername
  const webhookUrl = status.data?.webhook?.url
  const pending = status.data?.webhook?.pending_update_count ?? 0
  const lastError = status.data?.webhook?.last_error_message

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BotIcon className="size-5 text-primary" />
            Статус бота
          </CardTitle>
          <CardDescription>
            Подключение Telegram-бота и текущее состояние webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : status.isError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              Не удалось получить статус: {(status.error as Error)?.message}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-11 items-center justify-center rounded-full',
                      status.data?.configured
                        ? 'bg-primary/15 text-primary'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {status.data?.configured ? (
                      <CheckCircle2 className="size-6" />
                    ) : (
                      <AlertTriangle className="size-6" />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">
                      {status.data?.configured
                        ? 'Бот подключён'
                        : 'TELEGRAM_BOT_TOKEN не задан'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {status.data?.configured
                        ? `@${botUsername || 'bot'}`
                        : 'Добавьте токен в переменные окружения Vercel'}
                    </p>
                  </div>
                </div>
                {status.data?.configured ? (
                  <Badge variant="secondary" className="gap-1">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    активен
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    <XCircle className="size-3" />
                    требуется токен
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow
                  icon={BotIcon}
                  label="Username бота"
                  value={
                    botUsername ? `@${botUsername}` : '—'
                  }
                />
                <InfoRow
                  icon={Webhook}
                  label="Webhook URL"
                  value={webhookUrl || setWebhookUrl || 'не установлен'}
                  mono
                />
                <InfoRow
                  icon={Link2}
                  label="Очередь обновлений"
                  value={String(pending)}
                />
                <InfoRow
                  icon={AlertTriangle}
                  label="Последняя ошибка"
                  value={lastError || 'нет'}
                  danger={!!lastError}
                />
              </div>

              {!status.data?.configured ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Бот не запущен
                  </p>
                  <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
                    Добавьте переменную окружения <code className="rounded bg-amber-500/15 px-1">TELEGRAM_BOT_TOKEN</code> в настройках Vercel
                    и переадеплойте проект, затем установите webhook ниже.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Webhook setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="size-4 text-primary" />
              Webhook
            </CardTitle>
            <CardDescription>
              Укажите публичный URL приложения, куда Telegram будет слать обновления
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="base-url">Базовый URL приложения</Label>
              <Input
                id="base-url"
                placeholder="https://my-trainer-bot.vercel.app"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                disabled={!status.data?.configured}
              />
              <p className="text-xs text-muted-foreground">
                К URL автоматически будет добавлен путь{' '}
                <code className="rounded bg-muted px-1">/api/telegram/webhook</code>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                deleteWebhook.mutate()
              }}
              disabled={!status.data?.configured || deleteWebhook.isPending}
            >
              {deleteWebhook.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Удалить webhook
            </Button>
            <Button
              onClick={() => {
                const v = baseUrl.trim()
                if (!v) {
                  toast.error('Укажите базовый URL')
                  return
                }
                setWebhook.mutate(v)
              }}
              disabled={
                !status.data?.configured ||
                setWebhook.isPending ||
                !baseUrl.trim()
              }
            >
              {setWebhook.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plug className="size-4" />
              )}
              Установить webhook
            </Button>
          </CardFooter>
        </Card>

        {/* Broadcast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4 text-primary" />
              Рассылка
            </CardTitle>
            <CardDescription>
              Отправить сообщение всем пользователям бота
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="broadcast-text">Текст сообщения</Label>
              <Textarea
                id="broadcast-text"
                rows={5}
                placeholder="🔥 Новость: стартовал набор на курс «Гипертрофия»!"
                value={broadcast}
                onChange={(e) => setBroadcast(e.target.value)}
                disabled={!status.data?.configured}
              />
              <p className="text-xs text-muted-foreground">
                Сообщение получат все клиенты, которые хотя бы раз писали боту.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              onClick={() => {
                const t = broadcast.trim()
                if (!t) {
                  toast.error('Введите текст рассылки')
                  return
                }
                broadcastMutation.mutate(t)
              }}
              disabled={
                !status.data?.configured ||
                broadcastMutation.isPending ||
                !broadcast.trim()
              }
            >
              {broadcastMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Отправить всем
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-500" />
            Управление данными
          </CardTitle>
          <CardDescription>
            Очистка истории переписки в админке. Сообщения в Telegram-клиенте
            остаются — бот их не контролирует.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Очистить переписку</p>
              <p className="text-xs text-muted-foreground">
                Удалит все сохранённые сообщения бота с клиентами. Заказы и профили клиентов сохранятся.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setResetOpen('messages')}
              disabled={clearMessages.isPending || fullReset.isPending}
            >
              <Trash2 className="size-4" />
              Очистить сообщения
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Полный сброс</p>
              <p className="text-xs text-muted-foreground">
                Удалит <span className="font-medium">всё</span>: клиентов, заказы и сообщения. Полезно перед стартом продаж.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setResetOpen('full')}
              disabled={clearMessages.isPending || fullReset.isPending}
            >
              <AlertTriangle className="size-4" />
              Полный сброс
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!resetOpen} onOpenChange={(v) => !v && setResetOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetOpen === 'full' ? 'Полный сброс данных?' : 'Очистить переписку?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetOpen === 'full'
                ? 'Это удалит ВСЕХ клиентов, все заказы и все сообщения без возможности восстановления. Бот останется работать — новые клиенты смогут писать /start.'
                : 'Это удалит все сохранённые сообщения из админ-панели. Заказы и клиенты сохранятся. В Telegram-клиенте сообщения останутся видны.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearMessages.isPending || fullReset.isPending}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (resetOpen === 'full') fullReset.mutate()
                else clearMessages.mutate()
              }}
              disabled={clearMessages.isPending || fullReset.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {clearMessages.isPending || fullReset.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {resetOpen === 'full' ? 'Удалить всё' : 'Очистить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deployment instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="size-4 text-primary" />
            Как запустить бота
          </CardTitle>
          <CardDescription>
            Четыре шага от создания бота до первого сообщения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step
            n={1}
            title="Создайте бота в @BotFather"
            body={
              <>
                Откройте в Telegram{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  @BotFather
                </a>
                , отправьте <code className="rounded bg-muted px-1">/newbot</code> и
                придумайте имя и username. Сохраните полученный{' '}
                <span className="font-medium">TELEGRAM_BOT_TOKEN</span>.
              </>
            }
          />
          <Step
            n={2}
            title="Добавьте токен в переменные окружения"
            body={
              <>
                В проекте на GitHub / Vercel откройте <span className="font-medium">Settings → Environment Variables</span> и
                добавьте:
                <code className="mt-2 block rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                  TELEGRAM_BOT_TOKEN=123456789:AA...
                </code>
                При необходимости задайте{' '}
                <code className="rounded bg-muted px-1">NEXT_PUBLIC_APP_URL</code> (публичный URL) и{' '}
                <code className="rounded bg-muted px-1">DATABASE_URL</code> (для production — Postgres).
              </>
            }
          />
          <Step
            n={3}
            title="Задеплойте и установите webhook"
            body={
              <>
                Задеплойте проект на Vercel, вернитесь на эту вкладку, введите
                базовый URL (например <code className="rounded bg-muted px-1">https://my-trainer-bot.vercel.app</code>)
                выше и нажмите <span className="font-medium">«Установить webhook»</span>. Telegram начнёт слать
                обновления на <code className="rounded bg-muted px-1">/api/telegram/webhook</code>.
              </>
            }
          />
          <Step
            n={4}
            title="Напишите /start боту в Telegram"
            body={
              <>
                Откройте вашего бота в Telegram и отправьте{' '}
                <code className="rounded bg-muted px-1">/start</code>. Клиенты увидят
                приветствие и меню с кнопками «Каталог», «Мои заказы», «О тренере», «Поддержка».
                Предпросмотр этого меню — на вкладке <span className="font-medium">«Превью бота»</span>.
              </>
            }
          />
          <Separator />
          <p className="text-xs text-muted-foreground">
            Подробный гайд по деплою grammy на Vercel:{' '}
            <a
              href="https://vercel.com/guides/grammy-bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              vercel.com/guides/grammy-bot
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  mono?: boolean
  danger?: boolean
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p
        className={cn(
          'mt-1 truncate text-sm font-medium',
          mono && 'font-mono text-xs',
          danger && 'text-destructive',
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}

function Step({
  n,
  title,
  body,
}: {
  n: number
  title: string
  body: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </span>
      <div className="space-y-1 pt-0.5">
        <p className="font-medium leading-tight">{title}</p>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </div>
  )
}
