'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquare,
  ShoppingBag,
  UserCircle2,
  Users as UsersIcon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  apiFetch,
  formatDate,
  formatPrice,
  ORDER_STATUS_SHORT,
  shortId,
  type OrderStatus,
} from '@/lib/format'
import { cn } from '@/lib/utils'

type UserRow = {
  id: string
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  createdAt: string
  _count: { orders: number; messages: number }
}

type UserDetail = {
  id: string
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  createdAt: string
  orders: {
    id: string
    status: OrderStatus
    amount: number
    createdAt: string
    product: { title: string; currency: string; type: string }
  }[]
  messages: {
    id: string
    direction: string
    text: string
    createdAt: string
  }[]
}

function initials(u: { firstName: string | null; lastName: string | null }) {
  const f = (u.firstName || '').trim()
  const l = (u.lastName || '').trim()
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase()
  if (f) return f[0].toUpperCase()
  if (l) return l[0].toUpperCase()
  return '??'
}

function displayName(u: {
  firstName: string | null
  lastName: string | null
  username: string | null
  telegramId: string
}) {
  const parts = [u.firstName, u.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return u.username ? `@${u.username}` : `id:${u.telegramId}`
}

export function UsersTab() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const list = useQuery<UserRow[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch<{ users: UserRow[] }>('/api/users')
      return res.users
    },
  })

  const detail = useQuery<UserDetail>({
    queryKey: ['user', selectedId],
    queryFn: () => apiFetch<{ user: UserDetail }>(`/api/users/${selectedId}`).then((r) => r.user),
    enabled: !!selectedId,
  })

  React.useEffect(() => {
    if (detail.isError) {
      toast.error('Не удалось загрузить профиль пользователя', {
        description: (detail.error as Error)?.message,
      })
    }
  }, [detail.isError, detail.error])

  const users = list.data || []

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <CardHeader className="px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="size-4 text-primary" />
            Пользователи ({users.length})
          </CardTitle>
          <CardDescription>
            Клиенты бота. Нажмите на строку, чтобы увидеть заказы и переписку.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : list.isError ? (
            <div className="p-6 text-center text-sm text-destructive">
              Не удалось загрузить пользователей: {(list.error as Error)?.message}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <UsersIcon className="size-8 text-muted-foreground/60" />
              Пользователей пока нет. Они появятся, как только напишут боту /start
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead className="hidden sm:table-cell">@username</TableHead>
                  <TableHead className="hidden md:table-cell">Telegram ID</TableHead>
                  <TableHead className="text-center">Заказы</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">
                    Сообщения
                  </TableHead>
                  <TableHead className="hidden whitespace-nowrap md:table-cell">
                    Регистрация
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar>
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                            {initials(u)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {displayName(u)}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {u.username ? `@${u.username}` : `id:${u.telegramId}`}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {u.username ? (
                        <span className="text-muted-foreground">@{u.username}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                      {u.telegramId}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="tabular-nums">
                        {u._count.orders}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-center tabular-nums sm:table-cell">
                      {u._count.messages}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                      {formatDate(u.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle2 className="size-5 text-primary" />
              Профиль клиента
            </DialogTitle>
            <DialogDescription>
              Заказы и недавняя переписка с ботом
            </DialogDescription>
          </DialogHeader>

          {detail.isLoading ? (
            <div className="space-y-3 p-1">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : detail.isError ? (
            <div className="p-6 text-center text-sm text-destructive">
              Не удалось загрузить профиль
            </div>
          ) : detail.data ? (
            <UserDetailBody user={detail.data} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserDetailBody({ user }: { user: UserDetail }) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      {/* Profile summary */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-primary/15 text-primary font-semibold">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate font-semibold">{displayName(user)}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {user.username ? <span>@{user.username}</span> : null}
            <span className="font-mono">id:{user.telegramId}</span>
            {user.phone ? <span>☎ {user.phone}</span> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShoppingBag className="size-3.5" />
            Заказов
          </div>
          <p className="text-2xl font-bold tabular-nums">{user.orders.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" />
            Сообщений
          </div>
          <p className="text-2xl font-bold tabular-nums">{user.messages.length}</p>
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Заказы</h4>
        {user.orders.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Заказов нет
          </p>
        ) : (
          <ScrollArea className="max-h-56 rounded-lg border">
            <ul className="divide-y">
              {user.orders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center gap-2 p-2.5 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    #{shortId(o.id)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{o.product.title}</span>
                  <Badge variant="outline" className="whitespace-nowrap">
                    {ORDER_STATUS_SHORT[o.status as OrderStatus] || o.status}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(o.amount, o.product.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      <Separator />

      {/* Messages */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Переписка (последние 50)</h4>
        {user.messages.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Сообщений нет
          </p>
        ) : (
          <ScrollArea className="max-h-72 rounded-lg border">
            <ul className="flex flex-col gap-2 p-3">
              {user.messages.map((m) => {
                const isOut = m.direction === 'out'
                return (
                  <li
                    key={m.id}
                    className={cn(
                      'flex items-start gap-2 text-sm',
                      isOut ? 'flex-row-reverse' : '',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                        isOut
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isOut ? (
                        <ArrowUpRight className="size-3" />
                      ) : (
                        <ArrowDownLeft className="size-3" />
                      )}
                    </span>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-1.5',
                        isOut
                          ? 'bg-primary/15 text-foreground'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {m.text}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {isOut ? 'от бота' : 'от клиента'} ·{' '}
                        {formatDate(m.createdAt)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
