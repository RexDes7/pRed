'use client'

import * as React from 'react'
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, Bot, Smartphone } from 'lucide-react'
import { Header } from '@/components/dashboard/header'
import { Footer } from '@/components/dashboard/footer'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ProductsTab } from '@/components/dashboard/products-tab'
import { OrdersTab } from '@/components/dashboard/orders-tab'
import { UsersTab } from '@/components/dashboard/users-tab'
import { SettingsTab } from '@/components/dashboard/settings-tab'
import { BotTab } from '@/components/dashboard/bot-tab'
import { BotPreview } from '@/components/dashboard/bot-preview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const TABS = [
  { value: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
  { value: 'products', label: 'Товары', icon: Package },
  { value: 'orders', label: 'Заказы', icon: ShoppingBag },
  { value: 'users', label: 'Клиенты', icon: Users },
  { value: 'settings', label: 'Настройки', icon: Settings },
  { value: 'bot', label: 'Бот', icon: Bot },
  { value: 'preview', label: 'Превью', icon: Smartphone },
] as const

export default function Home() {
  const [tab, setTab] = React.useState<string>('dashboard')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            {/* Horizontally scrollable tab bar on mobile */}
            <div className="scrollbar-emerald -mx-1 overflow-x-auto px-1 pb-1">
              <TabsList className="h-auto w-max flex-nowrap gap-1 p-1">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5',
                      tab === value && 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="whitespace-nowrap">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
              <StatsCards />
            </TabsContent>
            <TabsContent value="products" className="mt-0 focus-visible:outline-none">
              <ProductsTab />
            </TabsContent>
            <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
              <OrdersTab />
            </TabsContent>
            <TabsContent value="users" className="mt-0 focus-visible:outline-none">
              <UsersTab />
            </TabsContent>
            <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
              <SettingsTab />
            </TabsContent>
            <TabsContent value="bot" className="mt-0 focus-visible:outline-none">
              <BotTab />
            </TabsContent>
            <TabsContent value="preview" className="mt-0 focus-visible:outline-none">
              <BotPreview />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
