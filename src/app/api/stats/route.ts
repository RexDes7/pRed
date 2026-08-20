import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const [usersCount, productsCount, activeProducts, orders, ordersByStatus] =
    await Promise.all([
      db.botUser.count(),
      db.product.count(),
      db.product.count({ where: { active: true } }),
      db.order.findMany({
        where: { status: { in: ['paid', 'fulfilled'] } },
        select: { amount: true },
      }),
      db.order.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

  const revenue = orders.reduce((sum, o) => sum + o.amount, 0)

  // Revenue by product type (last 30 days, paid/fulfilled)
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000)
  const recentOrders = await db.order.findMany({
    where: {
      status: { in: ['paid', 'fulfilled'] },
      createdAt: { gte: since },
    },
    include: { product: { select: { type: true, title: true } } },
  })

  const byType: Record<string, number> = { course: 0, service: 0, program: 0 }
  const topProducts = new Map<string, { count: number; revenue: number }>()
  for (const o of recentOrders) {
    const t = o.product.type
    byType[t] = (byType[t] || 0) + o.amount
    const key = o.product.title
    const cur = topProducts.get(key) || { count: 0, revenue: 0 }
    cur.count += 1
    cur.revenue += o.amount
    topProducts.set(key, cur)
  }

  const topProductsList = Array.from(topProducts.entries())
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const statusCounts: Record<string, number> = {}
  for (const s of ordersByStatus) statusCounts[s.status] = s._count

  return NextResponse.json({
    ok: true,
    users: usersCount,
    products: productsCount,
    activeProducts,
    revenue,
    paidOrders: orders.length,
    statusCounts,
    revenueByType: byType,
    topProducts: topProductsList,
    recentOrdersCount: recentOrders.length,
  })
}
