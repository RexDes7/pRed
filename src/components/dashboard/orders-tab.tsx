'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronDown,
  ClipboardList,
  Loader2,
  MoreHorizontal,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  apiFetch,
  formatDate,
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SHORT,
  shortId,
  type OrderStatus,
} from '@/lib/format'

type Order = {
  id: string
  userId: string
  productId: string
  status: OrderStatus
  amount: number
  customerNote: string | null
  createdAt: string
  updatedAt: string
  product: { title: string; currency: string; type: string }
  user: {
    firstName: string | null
    lastName: string | null
    username: string | null
    telegramId: string
  }
}

const STATUSES: OrderStatus[] = ['new', 'paid', 'fulfilled', 'cancelled']

function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case 'new':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
    case 'paid':
      return 'bg-primary/15 text-primary border-primary/25'
    case 'fulfilled':
      return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25'
    case 'cancelled':
      return 'bg-destructive/15 text-destructive border-destructive/25'
  }
}

function customerName(o: Order): string {
  const parts = [o.user.firstName, o.user.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return o.user.username ? `@${o.user.username}` : `id:${o.user.telegramId}`
}

export function OrdersTab() {
  const qc = useQueryClient()
  const [filter, setFilter] = React.useState<'all' | OrderStatus>('all')

  const query = useQuery<Order[]>({
    queryKey: ['orders', filter],
    queryFn: async () => {
      const qs = filter === 'all' ? '' : `?status=${filter}`
      const res = await apiFetch<{ orders: Order[] }>(`/api/orders${qs}`)
      return res.orders
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiFetch<{ order: Order }>(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, vars) => {
      toast.success(`Статус изменён: ${ORDER_STATUS_SHORT[vars.status]}`)
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: unknown) =>
      toast.error('Не удалось изменить статус', {
        description: (e as Error).message,
      }),
  })

  const orders = query.data || []

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const s of STATUSES) c[s] = orders.filter((o) => o.status === s).length
    return c
  }, [orders])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="Все"
          count={counts.all}
        />
        {STATUSES.map((s) => (
          <FilterPill
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={ORDER_STATUS_SHORT[s]}
            count={counts[s]}
          />
        ))}
      </div>

      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-primary" />
            Заказы ({formatCount(counts.all)})
          </CardTitle>
          <CardDescription>
            Изменяйте статус через меню справа. Клиент получит уведомление от бота.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="p-6 text-center text-sm text-destructive">
              Не удалось загрузить заказы: {(query.error as Error)?.message}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <ClipboardList className="size-8 text-muted-foreground/60" />
              {filter === 'all'
                ? 'Заказов пока нет'
                : `Нет заказов со статусом «${ORDER_STATUS_SHORT[filter as OrderStatus]}»`}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="hidden whitespace-nowrap md:table-cell">
                    Дата
                  </TableHead>
                  <TableHead className="w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const busy =
                    updateMutation.isPending &&
                    updateMutation.variables?.id === o.id
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{shortId(o.id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="max-w-[200px] truncate font-medium sm:max-w-xs">
                            {o.product.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {o.product.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="max-w-[160px] truncate">
                            {customerName(o)}
                          </span>
                          {o.user.username ? (
                            <span className="text-xs text-muted-foreground">
                              @{o.user.username}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatPrice(o.amount, o.product.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('whitespace-nowrap', statusBadgeClass(o.status))}
                        >
                          {ORDER_STATUS_SHORT[o.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              className="gap-1"
                              aria-label="Изменить статус"
                            >
                              {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                              <ChevronDown className="size-3 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Статус заказа</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {STATUSES.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() =>
                                  updateMutation.mutate({ id: o.id, status: s })
                                }
                                disabled={s === o.status}
                              >
                                <span
                                  className={cn(
                                    'mr-2 inline-block size-2 rounded-full',
                                    s === o.status
                                      ? 'bg-primary'
                                      : 'bg-muted-foreground/40',
                                  )}
                                />
                                {ORDER_STATUS_LABELS[s]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatCount(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n)
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            'rounded-full px-1.5 text-xs tabular-nums',
            active ? 'bg-primary-foreground/20' : 'bg-muted',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
