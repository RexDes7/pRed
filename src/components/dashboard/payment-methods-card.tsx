'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { apiFetch } from '@/lib/format'
import { cn } from '@/lib/utils'

type PaymentMethod = {
  id: string
  type: 'card' | 'phone' | 'crypto' | 'upi' | 'other'
  label: string
  value: string
  hint: string | null
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

const TYPE_OPTIONS: { value: PaymentMethod['type']; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'card', label: 'Карта', icon: CreditCard },
  { value: 'phone', label: 'Телефон / СБП', icon: Smartphone },
  { value: 'crypto', label: 'Крипта', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: CreditCard },
  { value: 'other', label: 'Другое', icon: CreditCard },
]

const TYPE_ICONS: Record<string, string> = {
  card: '💳',
  phone: '📱',
  crypto: '💎',
  upi: '🔗',
  other: '🔁',
}

type FormState = {
  type: PaymentMethod['type']
  label: string
  value: string
  hint: string
  order: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  type: 'card',
  label: '',
  value: '',
  hint: '',
  order: '1',
  active: true,
}

function PaymentFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  saving,
  mode,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: PaymentMethod | null
  onSave: (state: FormState) => void
  saving: boolean
  mode: 'create' | 'edit'
}) {
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)

  React.useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        type: initial.type,
        label: initial.label,
        value: initial.value,
        hint: initial.hint || '',
        order: String(initial.order ?? 0),
        active: initial.active,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [initial, open])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {mode === 'create' ? 'Новый реквизит' : 'Редактировать реквизит'}
        </DialogTitle>
        <DialogDescription>
          Клиент увидит кнопку — при нажатии значение скопируется в буфер обмена.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave(form)
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pm-type">Тип</Label>
            <Select
              value={form.type}
              onValueChange={(v) => set('type', v as PaymentMethod['type'])}
            >
              <SelectTrigger id="pm-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {TYPE_ICONS[o.value]} {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pm-order">Порядок</Label>
            <Input
              id="pm-order"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="1"
              value={form.order}
              onChange={(e) => set('order', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pm-label">Название</Label>
          <Input
            id="pm-label"
            placeholder="Сбербанк / Тинькофф / USDT TRC20 / СБП"
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pm-value">Реквизит (скопируется в буфер)</Label>
          <Input
            id="pm-value"
            placeholder="2200 0000 0000 0000 / +79991234567 / TXyz..."
            value={form.value}
            onChange={(e) => set('value', e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Именно это значение скопируется клиенту при нажатии кнопки в боте.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pm-hint">Подсказка (необязательно)</Label>
          <Input
            id="pm-hint"
            placeholder="Получатель: Рафаэль А. / Сеть: TRC20"
            value={form.hint}
            onChange={(e) => set('hint', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Покажется под названием в списке реквизитов в боте.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="pm-active" className="cursor-pointer">
              Активен
            </Label>
            <p className="text-xs text-muted-foreground">
              Неактивные не показываются клиентам
            </p>
          </div>
          <Switch
            id="pm-active"
            checked={form.active}
            onCheckedChange={(v) => set('active', v)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === 'create' ? (
              <Plus className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}
            {mode === 'create' ? 'Добавить' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function PaymentMethodsCard() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PaymentMethod | null>(null)
  const [deleting, setDeleting] = React.useState<PaymentMethod | null>(null)

  const query = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await apiFetch<{ methods: PaymentMethod[] }>('/api/payment-methods')
      return res.methods
    },
  })

  const createMutation = useMutation({
    mutationFn: (state: FormState) =>
      apiFetch<{ method: PaymentMethod }>('/api/payment-methods', {
        method: 'POST',
        body: JSON.stringify({
          type: state.type,
          label: state.label,
          value: state.value,
          hint: state.hint || undefined,
          order: Number(state.order) || 0,
          active: state.active,
        }),
      }),
    onSuccess: () => {
      toast.success('Реквизит добавлен')
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      setCreateOpen(false)
    },
    onError: (e: unknown) =>
      toast.error('Не удалось добавить', {
        description: (e as Error).message,
      }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: FormState }) =>
      apiFetch<{ method: PaymentMethod }>(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: state.type,
          label: state.label,
          value: state.value,
          hint: state.hint || null,
          order: Number(state.order) || 0,
          active: state.active,
        }),
      }),
    onSuccess: () => {
      toast.success('Реквизит обновлён')
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      setEditing(null)
    },
    onError: (e: unknown) =>
      toast.error('Не удалось сохранить', {
        description: (e as Error).message,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/payment-methods/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Реквизит удалён')
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      setDeleting(null)
    },
    onError: (e: unknown) =>
      toast.error('Не удалось удалить', {
        description: (e as Error).message,
      }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<{ method: PaymentMethod }>(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
    },
    onError: (e: unknown) =>
      toast.error('Не удалось изменить статус', {
        description: (e as Error).message,
      }),
  })

  const methods = query.data || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-primary" />
          Реквизиты для оплаты
        </CardTitle>
        <CardDescription>
          Клиенты видят кнопки в боте — при нажатии реквизит копируется в буфер
          обмена и его можно сразу вставить в банк. Можно добавить несколько.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-destructive">
            Не удалось загрузить: {(query.error as Error)?.message}
          </p>
        ) : methods.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CreditCard className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">Реквизитов пока нет</p>
              <p className="text-sm text-muted-foreground">
                Добавьте карту, телефон (СБП) или криптокошелёк
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {methods.map((m) => {
              const icon = TYPE_ICONS[m.type] || '🔁'
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{m.label}</p>
                      {!m.active ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          скрыт
                        </Badge>
                      ) : null}
                      <Badge variant="secondary" className="text-xs text-muted-foreground">
                        #{m.order}
                      </Badge>
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {m.value}
                    </p>
                    {m.hint ? (
                      <p className="truncate text-xs text-muted-foreground/80">
                        {m.hint}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                      <Switch
                        checked={m.active}
                        onCheckedChange={(v) =>
                          toggleMutation.mutate({ id: m.id, active: v })
                        }
                        disabled={
                          toggleMutation.isPending &&
                          toggleMutation.variables?.id === m.id
                        }
                        aria-label="Активность реквизита"
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(m)}
                      aria-label="Редактировать"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(m)}
                      aria-label="Удалить"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="size-4" />
              Добавить реквизит
            </Button>
          </DialogTrigger>
          <PaymentFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            initial={null}
            mode="create"
            saving={createMutation.isPending}
            onSave={(state) => createMutation.mutate(state)}
          />
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
          {editing ? (
            <PaymentFormDialog
              open={!!editing}
              onOpenChange={(v) => !v && setEditing(null)}
              initial={editing}
              mode="edit"
              saving={updateMutation.isPending}
              onSave={(state) => updateMutation.mutate({ id: editing.id, state })}
            />
          ) : null}
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить реквизит?</AlertDialogTitle>
              <AlertDialogDescription>
                «<span className="font-medium">{deleting?.label}</span>» будет
                удалён. Клиенты больше не увидят эту кнопку оплаты.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  if (deleting) deleteMutation.mutate(deleting.id)
                }}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
