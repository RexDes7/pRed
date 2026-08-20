'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Bot,
  CreditCard,
  Info,
  Loader2,
  Phone,
  Save,
  Send,
  User,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/format'

type Settings = {
  id: string
  trainerName: string | null
  welcomeText: string | null
  aboutText: string | null
  paymentInfo: string | null
  contactInfo: string | null
  adminChatId: string | null
  botUsername: string | null
  webhookUrl: string | null
}

export function SettingsTab() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => apiFetch<{ settings: Settings }>('/api/settings').then((r) => r.settings),
  })

  // Local form state, synced when data loads.
  const [form, setForm] = React.useState({
    trainerName: '',
    welcomeText: '',
    aboutText: '',
    paymentInfo: '',
    contactInfo: '',
    adminChatId: '',
    botUsername: '',
  })
  const [loadedId, setLoadedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!data) return
    if (loadedId === data.id) return
    setForm({
      trainerName: data.trainerName || '',
      welcomeText: data.welcomeText || '',
      aboutText: data.aboutText || '',
      paymentInfo: data.paymentInfo || '',
      contactInfo: data.contactInfo || '',
      adminChatId: data.adminChatId || '',
      botUsername: data.botUsername || '',
    })
    setLoadedId(data.id)
  }, [data, loadedId])

  const dirty = React.useMemo(() => {
    if (!data) return false
    return (
      form.trainerName !== (data.trainerName || '') ||
      form.welcomeText !== (data.welcomeText || '') ||
      form.aboutText !== (data.aboutText || '') ||
      form.paymentInfo !== (data.paymentInfo || '') ||
      form.contactInfo !== (data.contactInfo || '') ||
      form.adminChatId !== (data.adminChatId || '') ||
      form.botUsername !== (data.botUsername || '')
    )
  }, [data, form])

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiFetch<{ settings: Settings }>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (res) => {
      toast.success('Настройки сохранены')
      qc.setQueryData(['settings'], res.settings)
      setLoadedId(res.settings.id)
    },
    onError: (e: unknown) =>
      toast.error('Не удалось сохранить', {
        description: (e as Error).message,
      }),
  })

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({ ...form })
  }

  if (isError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Ошибка загрузки</CardTitle>
          <CardDescription>{(error as Error)?.message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-primary" />
            Профиль тренера
          </CardTitle>
          <CardDescription>
            Эти данные видят клиенты в боте: приветствие, «О тренере», оплата и контакты.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s-trainer">Имя тренера</Label>
                  <Input
                    id="s-trainer"
                    placeholder="Александр Петров"
                    value={form.trainerName}
                    onChange={(e) => set('trainerName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-admin">Admin chat ID</Label>
                  <Input
                    id="s-admin"
                    placeholder="123456789"
                    value={form.adminChatId}
                    onChange={(e) => set('adminChatId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ваш Telegram chat id, куда бот пришлёт уведомление о новом заказе.
                    Узнать через @userinfobot.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="s-welcome" className="flex items-center gap-1.5">
                  <Send className="size-3.5 text-primary" />
                  Приветственное сообщение (/start)
                </Label>
                <Textarea
                  id="s-welcome"
                  rows={3}
                  placeholder="Привет! Я тренер по фитнесу. Помогу выбрать курс или программу."
                  value={form.welcomeText}
                  onChange={(e) => set('welcomeText', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="s-about" className="flex items-center gap-1.5">
                  <Info className="size-3.5 text-primary" />
                  О тренере
                </Label>
                <Textarea
                  id="s-about"
                  rows={4}
                  placeholder="Сертифицированный тренер с 8-летним стажем. Чемпион области по пауэрлифтингу."
                  value={form.aboutText}
                  onChange={(e) => set('aboutText', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s-payment" className="flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-primary" />
                    Реквизиты для оплаты
                  </Label>
                  <Textarea
                    id="s-payment"
                    rows={3}
                    placeholder="Оплата на карту 2200 … (Сбербанк). После оплаты пришлите чек."
                    value={form.paymentInfo}
                    onChange={(e) => set('paymentInfo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-contact" className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-primary" />
                    Контакты поддержки
                  </Label>
                  <Textarea
                    id="s-contact"
                    rows={3}
                    placeholder="Поддержка: @trainer_bot_support"
                    value={form.contactInfo}
                    onChange={(e) => set('contactInfo', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="s-bot" className="flex items-center gap-1.5">
                  <Bot className="size-3.5 text-primary" />
                  Username бота (для отображения)
                </Label>
                <Input
                  id="s-bot"
                  placeholder="@my_trainer_bot"
                  value={form.botUsername}
                  onChange={(e) => set('botUsername', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Сохраняется для справки. Webhook устанавливается на вкладке «Бот».
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || saveMutation.isPending}
            onClick={() => {
              if (!data) return
              setForm({
                trainerName: data.trainerName || '',
                welcomeText: data.welcomeText || '',
                aboutText: data.aboutText || '',
                paymentInfo: data.paymentInfo || '',
                contactInfo: data.contactInfo || '',
                adminChatId: data.adminChatId || '',
                botUsername: data.botUsername || '',
              })
            }}
          >
            Отменить изменения
          </Button>
          <Button type="submit" disabled={!dirty || saveMutation.isPending || isLoading}>
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Сохранить
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
