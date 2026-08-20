'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ImagePlus,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ProductImage } from '@/components/dashboard/product-image'
import {
  apiFetch,
  featuresToList,
  formatPrice,
  listToFeatures,
  PRODUCT_TYPE_LABELS,
  type ProductType,
} from '@/lib/format'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  type: ProductType
  title: string
  description: string
  price: number
  currency: string
  duration: string | null
  imageUrl: string | null
  features: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

type ProductFormState = {
  type: ProductType
  title: string
  description: string
  price: string
  duration: string
  imageUrl: string
  features: string
  active: boolean
}

const EMPTY_FORM: ProductFormState = {
  type: 'course',
  title: '',
  description: '',
  price: '',
  duration: '',
  imageUrl: '',
  features: '',
  active: true,
}

function typeBadgeClass(type: ProductType) {
  switch (type) {
    case 'course':
      return 'bg-primary/15 text-primary border-primary/20'
    case 'service':
      return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20'
    case 'program':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20'
  }
}

function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  saving,
  mode,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: Product | null
  onSave: (state: ProductFormState) => void
  saving: boolean
  mode: 'create' | 'edit'
}) {
  const [form, setForm] = React.useState<ProductFormState>(EMPTY_FORM)
  const [featuresDraft, setFeaturesDraft] = React.useState('')

  React.useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        type: initial.type,
        title: initial.title,
        description: initial.description,
        price: String(initial.price / 100),
        duration: initial.duration || '',
        imageUrl: initial.imageUrl || '',
        features: initial.features || '',
        active: initial.active,
      })
      setFeaturesDraft(featuresToList(initial.features).join('\n'))
    } else {
      setForm(EMPTY_FORM)
      setFeaturesDraft('')
    }
  }, [initial, open])

  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // Convert features draft (one per line) -> pipe-separated
    const list = featuresDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    onSave({ ...form, features: listToFeatures(list), price: form.price })
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {mode === 'create' ? 'Новый товар' : 'Редактировать товар'}
        </DialogTitle>
        <DialogDescription>
          {mode === 'create'
            ? 'Добавьте курс, услугу или программу в каталог бота'
            : 'Изменения сразу появятся в боте'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-type">Тип</Label>
            <Select
              value={form.type}
              onValueChange={(v) => set('type', v as ProductType)}
            >
              <SelectTrigger id="p-type" className="w-full">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Курс</SelectItem>
                <SelectItem value="service">Услуга</SelectItem>
                <SelectItem value="program">Программа</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-price">Цена, ₽</Label>
            <Input
              id="p-price"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="4900"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="p-title">Название</Label>
          <Input
            id="p-title"
            placeholder="Курс «Гипертрофия: 12 недель к массе»"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="p-desc">Описание</Label>
          <Textarea
            id="p-desc"
            rows={4}
            placeholder="Короткое описание товара для бота"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-duration">Длительность</Label>
            <Input
              id="p-duration"
              placeholder="12 недель"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-image">URL изображения</Label>
            <Input
              id="p-image"
              placeholder="/images/product.jpg или https://…"
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="p-features">Особенности (по одной на строку)</Label>
          <Textarea
            id="p-features"
            rows={4}
            placeholder={"36 видеоуроков\nПрограмма тренировок\nЧат поддержки"}
            value={featuresDraft}
            onChange={(e) => setFeaturesDraft(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Сохраняются как список фич, показываются в карточке товара
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="p-active" className="cursor-pointer">
              Активен в каталоге
            </Label>
            <p className="text-xs text-muted-foreground">
              Неактивные товары не видны клиентам в боте
            </p>
          </div>
          <Switch
            id="p-active"
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
              <PackagePlus className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}
            {mode === 'create' ? 'Создать товар' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleActive,
  toggling,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
  toggling: boolean
}) {
  const features = featuresToList(product.features)
  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <ProductImage
        src={product.imageUrl}
        alt={product.title}
        className="aspect-[16/10] w-full"
      />
      <CardHeader className="gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge className={cn('border', typeBadgeClass(product.type))}>
            {PRODUCT_TYPE_LABELS[product.type]}
          </Badge>
          {product.duration ? (
            <span className="text-xs text-muted-foreground">
              {product.duration}
            </span>
          ) : null}
        </div>
        <CardTitle className="line-clamp-2 text-base leading-snug">
          {product.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="text-xl font-bold tabular-nums">
          {formatPrice(product.price, product.currency)}
        </div>
        {features.length > 0 ? (
          <ul className="flex flex-wrap gap-1">
            {features.slice(0, 4).map((f) => (
              <li
                key={f}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {f}
              </li>
            ))}
            {features.length > 4 ? (
              <li className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{features.length - 4}
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground/70">без особенностей</p>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="items-center justify-between gap-2 p-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Switch
            checked={product.active}
            onCheckedChange={onToggleActive}
            disabled={toggling}
            aria-label="Активность товара"
          />
          <span className="text-muted-foreground">
            {product.active ? 'Активен' : 'Скрыт'}
          </span>
        </label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            aria-label="Редактировать"
          >
            <Pencil className="size-4" />
            <span className="hidden sm:inline">Изменить</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Удалить"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function ProductsTab() {
  const qc = useQueryClient()
  const [filter, setFilter] = React.useState<'all' | ProductType>('all')
  const [showInactive, setShowInactive] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | null>(null)
  const [deleting, setDeleting] = React.useState<Product | null>(null)

  const query = useQuery<Product[]>({
    queryKey: ['products', filter, showInactive],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('type', filter)
      if (showInactive === 'active') params.set('active', 'true')
      if (showInactive === 'inactive') params.set('active', 'false')
      const qs = params.toString()
      const res = await apiFetch<{ products: Product[] }>(
        `/api/products${qs ? `?${qs}` : ''}`,
      )
      return res.products
    },
  })

  const createMutation = useMutation({
    mutationFn: (state: ProductFormState) =>
      apiFetch<{ product: Product }>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          type: state.type,
          title: state.title,
          description: state.description,
          price: Math.round(Number(state.price) * 100),
          currency: 'RUB',
          duration: state.duration || undefined,
          imageUrl: state.imageUrl || undefined,
          features: state.features || undefined,
          active: state.active,
        }),
      }),
    onSuccess: () => {
      toast.success('Товар добавлен в каталог')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setCreateOpen(false)
    },
    onError: (e: unknown) => toast.error('Не удалось создать товар', {
      description: (e as Error).message,
    }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: ProductFormState }) =>
      apiFetch<{ product: Product }>(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: state.type,
          title: state.title,
          description: state.description,
          price: Math.round(Number(state.price) * 100),
          currency: 'RUB',
          duration: state.duration || null,
          imageUrl: state.imageUrl || null,
          features: state.features || null,
          active: state.active,
        }),
      }),
    onSuccess: () => {
      toast.success('Товар обновлён')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setEditing(null)
    },
    onError: (e: unknown) => toast.error('Не удалось сохранить', {
      description: (e as Error).message,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Товар удалён')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setDeleting(null)
    },
    onError: (e: unknown) => toast.error('Не удалось удалить', {
      description: (e as Error).message,
    }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<{ product: Product }>(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: unknown, vars) => {
      toast.error('Не удалось изменить статус', {
        description: (e as Error).message,
      })
      // revert optimistic by refetch
      void vars
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const products = query.data || []
  const sorted = [...products].sort(
    (a, b) => Number(a.active) - Number(b.active) || a.price - b.price,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | ProductType)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="course">Курсы</SelectItem>
              <SelectItem value="service">Услуги</SelectItem>
              <SelectItem value="program">Программы</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={showInactive}
            onValueChange={(v) => setShowInactive(v as 'all' | 'active' | 'inactive')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все товары</SelectItem>
              <SelectItem value="active">Только активные</SelectItem>
              <SelectItem value="inactive">Только скрытые</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Добавить товар
            </Button>
          </DialogTrigger>
          <ProductFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            initial={null}
            mode="create"
            saving={createMutation.isPending}
            onSave={(state) => createMutation.mutate(state)}
          />
        </Dialog>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : query.isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Ошибка загрузки</CardTitle>
            <CardDescription>{(query.error as Error)?.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ImagePlus className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">Каталог пуст</p>
              <p className="text-sm text-muted-foreground">
                Добавьте первый товар — курс, услугу или программу
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Добавить товар
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => setEditing(p)}
              onDelete={() => setDeleting(p)}
              onToggleActive={() =>
                toggleMutation.mutate({ id: p.id, active: !p.active })
              }
              toggling={
                toggleMutation.isPending &&
                toggleMutation.variables?.id === p.id
              }
            />
          ))}
        </div>
      )}

      {/* Edit dialog (controlled externally) */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        {editing ? (
          <ProductFormDialog
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
            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Товар <span className="font-medium">{deleting?.title}</span> будет
              удалён без возможности восстановления. Связанные заказы также
              будут удалены.
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
    </div>
  )
}
