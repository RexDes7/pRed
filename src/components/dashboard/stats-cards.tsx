'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  CircleDollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  apiFetch,
  formatDate,
  formatNumber,
  formatPrice,
  ORDER_STATUS_SHORT,
  PRODUCT_TYPE_LABELS,
  shortId,
  type OrderStatus,
} from '@/lib/format'

type Stats = {
  users: number
  products: number
  activeProducts: number
  revenue: number
  paidOrders: number
  statusCounts: Record<string, number>
  revenueByType: { course: number; service: number; program: number }
  topProducts: { title: string; count: number; revenue: number }[]
  recentOrdersCount: number
}

type OrderList = {
  id: string
  status: OrderStatus
  amount: number
  createdAt: string
  product: { title: string; currency: string; type: string }
  user: { firstName: string | null; lastName: string | null; username: string | null }
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  accent?: 'emerald' | 'amber' | 'teal'
}) {
  const accentClasses =
    accent === 'amber'
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
      : accent === 'teal'
        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
        : 'bg-primary/15 text-primary'
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums sm:text-3xl">
              {value}
            </CardTitle>
          </div>
          <span
            className={`flex size-10 items-center justify-center rounded-xl ${accentClasses}`}
          >
            <Icon className="size-5" />
          </span>
        </div>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardHeader>
    </Card>
  )
}

function StatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="size-10 rounded-xl" />
        </div>
        <Skeleton className="mt-2 h-3 w-32" />
      </CardHeader>
    </Card>
  )
}

export function StatsCards() {
  const { data, isLoading, isError, error } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => apiFetch<Stats>('/api/stats'),
  })

  const ordersQuery = useQuery<OrderList[]>({
    queryKey: ['orders', 'recent'],
    queryFn: async () => {
      const res = await apiFetch<{ orders: OrderList[] }>('/api/orders')
      return res.orders
    },
  })

  const chartData = React.useMemo(() => {
    if (!data) return []
    return [
      { name: PRODUCT_TYPE_LABELS.course, value: (data.revenueByType.course || 0) / 100 },
      { name: PRODUCT_TYPE_LABELS.service, value: (data.revenueByType.service || 0) / 100 },
      { name: PRODUCT_TYPE_LABELS.program, value: (data.revenueByType.program || 0) / 100 },
    ]
  }, [data])

  if (isError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Не удалось загрузить статистику</CardTitle>
          <CardDescription>{(error as Error).message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Пользователи"
              value={formatNumber(data.users)}
              hint="Зарегистрированы в боте"
              icon={Users}
              accent="emerald"
            />
            <StatCard
              title="Товары"
              value={formatNumber(data.products)}
              hint={`${formatNumber(data.activeProducts)} активных в каталоге`}
              icon={Package}
              accent="teal"
            />
            <StatCard
              title="Выручка"
              value={formatPrice(data.revenue)}
              hint={`Оплачено заказов: ${formatNumber(data.paidOrders)}`}
              icon={CircleDollarSign}
              accent="amber"
            />
            <StatCard
              title="Заказы"
              value={formatNumber(
                Object.values(data.statusCounts).reduce((a, b) => a + (b || 0), 0),
              )}
              hint={`За 30 дней: ${formatNumber(data.recentOrdersCount)}`}
              icon={ShoppingBag}
              accent="emerald"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue by type chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle>Выручка по типам товаров</CardTitle>
            </div>
            <CardDescription>Оплаченные заказы за последние 30 дней, ₽</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.every((d) => d.value === 0) ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Activity className="size-8 text-muted-foreground/60" />
                Пока нет оплаченных заказов за последние 30 дней
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}к` : `${v}`
                      }
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={42}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                      formatter={(value: number) => [formatPrice(value * 100), 'Выручка']}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--popover)',
                        color: 'var(--popover-foreground)',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={88}
                      fill="var(--chart-1)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Топ товаров</CardTitle>
            <CardDescription>По выручке за 30 дней</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data.topProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Нет данных за 30 дней
              </div>
            ) : (
              <ol className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <li key={p.title} className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(p.count)} продаж
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatPrice(p.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Последние заказы</CardTitle>
              <CardDescription>Самые свежие заказы из бота</CardDescription>
            </div>
            <Badge variant="secondary">{formatNumber(ordersQuery.data?.length || 0)} всего</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : ordersQuery.isError ? (
            <p className="py-6 text-center text-sm text-destructive">
              Не удалось загрузить заказы
            </p>
          ) : (ordersQuery.data || []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Заказов пока нет. Пользователи появятся, как только напишут боту /start
            </div>
          ) : (
            <ul className="divide-y">
              {(ordersQuery.data || []).slice(0, 6).map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center gap-2 py-2.5 text-sm"
                >
                  <Badge variant="outline" className="font-mono">
                    #{shortId(o.id)}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {o.product.title}
                  </span>
                  <span className="text-muted-foreground">
                    {ORDER_STATUS_SHORT[o.status as OrderStatus] || o.status}
                  </span>
                  <Separator orientation="vertical" className="hidden h-4 sm:block" />
                  <span className="font-semibold tabular-nums">
                    {formatPrice(o.amount, o.product.currency)}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {formatDate(o.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Полный список и фильтры — на вкладке{' '}
            <span className="font-medium text-primary">Заказы</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
