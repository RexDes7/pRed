# 🏋️ ТренерБот — Telegram-бот для продаж тренера

Автоматизация продаж курсов, услуг и программ тренировок для тренера тренажёрного зала.
Бот общается с клиентами в Telegram, а тренер управляет каталогом, заказами и рассылками
через веб-панель администратора.

**Стек:** GitHub + Vercel + Next.js 16 (TypeScript) + Prisma + [grammY](https://grammy.dev/) + Tailwind CSS + shadcn/ui.

---

## ✨ Возможности

### Для клиентов (в Telegram)
- 🛒 **Каталог** — курсы, услуги, программы с описанием, ценой, фото и списком особенностей
- 📦 **Мои заказы** — история покупок со статусами
- 💪 **О тренере** — регалии и контактная информация
- 💬 **Поддержка** — связь с тренером через бот
- Оформление заказа в пару тапов → реквизиты для оплаты → присылаете чек → администратор подтверждает

### Для тренера (веб-панель на `/`)
- 📊 **Обзор** — KPI (пользователи, товары, выручка, заказы), график выручки по типам, топ товаров, последние заказы
- 📦 **Товары** — полный CRUD: создание/редактирование/удаление, переключатель активности, фильтры по типу
- 🛒 **Заказы** — список со статусами (`new` / `paid` / `fulfilled` / `cancelled`), смена статуса, заметки
- 👥 **Клиенты** — список пользователей бота с заказами и перепиской
- ⚙️ **Настройки** — имя тренера, тексты приветствия/о себе, реквизиты оплаты, контакты
- 🤖 **Бот** — статус подключения, установка/удаление webhook, рассылка всем клиентам, инструкция по запуску
- 📱 **Превью** — интерактивный макет чата с ботом

---

## 🛠 Технологии

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 16 (App Router) |
| Язык | TypeScript 5 |
| Бот | grammY 1.45 (TypeScript-first, serverless-friendly) |
| База данных | Prisma ORM (SQLite для dev, PostgreSQL для Vercel) |
| Стилизация | Tailwind CSS 4 + shadcn/ui (New York) |
| Иконки | lucide-react |
| Графики | Recharts |
| Состояние | TanStack Query (server) + React state (client) |
| Темы | next-themes (светлая/тёмная) |
| Уведомления | sonner (toast) |

---

## 🚀 Быстрый старт (локально)

```bash
# 1. Установите зависимости
bun install

# 2. Создайте .env на основе .env.example и заполните TELEGRAM_BOT_TOKEN
cp .env.example .env
#   Получите токен у @BotFather: https://t.me/BotFather → /newbot

# 3. Примените схему к БД и заполните демо-данными (6 товаров)
bun run db:push
bun run db:seed

# 4. Запустите dev-сервер
bun run dev
#   Откройте http://localhost:3000
```

> Если токен пока нет — панель всё равно откроется. Бот активируется, как только вы добавите `TELEGRAM_BOT_TOKEN`.

---

## ☁️ Деплой на Vercel + GitHub

### Шаг 1. Запушьте репозиторий на GitHub
```bash
git init
git add .
git commit -m "ТренерБот: фитнес-бот для продаж тренера"
git branch -M main
git remote add origin https://github.com/<ВАШ_ЛОГИН>/trainer-bot.git
git push -u origin main
```

> Файлы `.env`, `db/*.db` уже в `.gitignore` — секреты не попадут в репозиторий.
> Шаблон `.env.example` коммитится как пример.

### Шаг 2. Создайте бота в Telegram
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Задайте имя (например, «Фитнес-бот Андрея») и username (например, `andrey_fitness_bot`)
4. Скопируйте `TELEGRAM_BOT_TOKEN` вида `123456789:AA…`

### Шаг 3. Создайте PostgreSQL-базу
SQLite не подходит для Vercel (read-only filesystem в serverless). Используйте бесплатный PostgreSQL:

- **[Neon](https://neon.tech)** — рекомендовано, 0.5 ГБ бесплатно, instant-branching
- **Vercel Postgres** — через Vercel Marketplace
- **[Supabase](https://supabase.com)** — 500 МБ бесплатно

Скопируйте connection string вида:
```
postgresql://user:password@host:5432/dbname?schema=public
```

### Шаг 4. Подключите репозиторий к Vercel
1. Зайдите на [vercel.com/new](https://vercel.com/new)
2. Import → выберите ваш GitHub-репозиторий
3. Framework Preset определится автоматически как **Next.js**
4. `vercel.json` уже настроен: `buildCommand = "prisma generate && next build"`

### Шаг 5. Задайте Environment Variables
В **Settings → Environment Variables** добавьте:

| Ключ | Значение | Окружение |
|------|----------|-----------|
| `TELEGRAM_BOT_TOKEN` | токен от @BotFather | Production + Preview |
| `DATABASE_URL` | `postgresql://…` из шага 3 | Production + Preview |
| `NEXT_PUBLIC_APP_URL` | `https://<ваш-домен>.vercel.app` | Production |
| `ADMIN_CHAT_ID` | ваш числовой Telegram ID (узнайте у [@userinfobot](https://t.me/userinfobot)) | Production (опционально) |

### Шаг 6. Переключите Prisma на PostgreSQL
В `prisma/schema.prisma` замените провайдер:
```prisma
datasource db {
  provider = "postgresql"   // ← было "sqlite"
  url      = env("DATABASE_URL")
}
```
Закоммитьте и запушьте. Vercel пересоберёт проект, `prisma generate` выполнится автоматически.

### Шаг 7. Создайте таблицы и заполните демо-данными
Vercel не запускает миграции автоматически. Выполните локально (с тем же `DATABASE_URL` в `.env`):
```bash
# временно подставьте production DATABASE_URL в .env
bun run db:push     # создаст таблицы
bun run db:seed      # добавит 6 демо-товаров + настройки по умолчанию
# верните локальный SQLite в .env: DATABASE_URL=file:./db/custom.db
```

### Шаг 8. Установите webhook
1. Откройте задеплоенный сайт → вкладка **«Бот»**
2. В поле «Базовый URL приложения» введите `https://<ваш-домен>.vercel.app`
3. Нажмите **«Установить webhook»**
4. Откройте вашего бота в Telegram и отправьте `/start` 🎉

Готово! Клиенты видят приветствие и меню. Заказы появляются во вкладке **«Заказы»** панели.

---

## 📁 Структура проекта

```
.
├── prisma/
│   ├── schema.prisma          # модели: BotUser, Product, Order, Message, BotSettings
│   └── seed.ts                # 6 демо-товаров + дефолтные настройки
├── public/
│   ├── logo.svg
│   └── images/                # обложки товаров (product-*.jpg)
├── src/
│   ├── app/
│   │   ├── page.tsx           # админ-панель с 7 табами
│   │   ├── layout.tsx         # метаданные, шрифты, Providers, Toaster
│   │   └── api/
│   │       ├── stats/         # GET — KPI для дашборда
│   │       ├── products/      # GET (list), POST (create)
│   │       ├── products/[id]/ # GET, PATCH, DELETE
│   │       ├── orders/        # GET (list, фильтр по статусу)
│   │       ├── orders/[id]/   # PATCH (status, customerNote)
│   │       ├── users/         # GET (list)
│   │       ├── users/[id]/    # GET (детали + заказы + сообщения)
│   │       ├── settings/      # GET, PATCH (singleton)
│   │       └── telegram/
│   │           ├── webhook/   # POST — приём обновлений от Telegram
│   │           ├── setwebhook/    # POST — установить webhook + команды
│   │           ├── delete-webhook/ # POST
│   │           ├── status/    # GET — getMe + getWebhookInfo
│   │           └── broadcast/ # POST — рассылка всем клиентам
│   ├── components/
│   │   ├── ui/                # shadcn/ui (Button, Card, Dialog, …)
│   │   └── dashboard/         # header, footer, stats-cards, products-tab, …
│   └── lib/
│       ├── db.ts              # экземпляр PrismaClient
│       ├── format.ts          # formatPrice, apiFetch, label-константы
│       ├── utils.ts           # cn() — merge Tailwind классов
│       └── telegram/
│           └── bot.ts         # вся логика grammY-бота
├── .env.example               # шаблон переменных окружения
├── vercel.json                # buildCommand с prisma generate
└── package.json               # скрипты: dev, build, db:push, db:seed, postinstall
```

---

## 🔌 API контракт

Все эндпоинты возвращают `{ ok: true, ... }` или `{ ok: false, error }`. Цены хранятся в **копейках** (целое число); на фронте делим на 100.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/stats` | KPI для дашборда: пользователи, товары, выручка, статусы, топ-товары |
| GET | `/api/products?type=…&active=…` | Список товаров с фильтрами |
| POST | `/api/products` | Создать товар `{ type, title, description, price, … }` |
| GET/PATCH/DELETE | `/api/products/[id]` | CRUD одного товара |
| GET | `/api/orders?status=…` | Список заказов |
| PATCH | `/api/orders/[id]` | Сменить статус / добавить заметку |
| GET | `/api/users` | Список клиентов (с _count заказов и сообщений) |
| GET | `/api/users/[id]` | Детали клиента + заказы + переписка |
| GET/PATCH | `/api/settings` | Singleton с настройками бота |
| GET | `/api/telegram/status` | `getMe` + `getWebhookInfo` + настройки |
| POST | `/api/telegram/setwebhook` | `{ url }` → устанавливает webhook + команды |
| POST | `/api/telegram/delete-webhook` | Удалить webhook |
| POST | `/api/telegram/broadcast` | `{ text }` → рассылка всем клиентам |
| POST | `/api/telegram/webhook` | Приём Update от Telegram (вызывается Telegram, не вами) |

**Типы товаров:** `course` (курс) · `service` (услуга) · `program` (программа)
**Статусы заказа:** `new` (ожидает оплаты) · `paid` (оплачен) · `fulfilled` (выполнен) · `cancelled` (отменён)

---

## 🧠 Логика бота (кратко)

- `/start` → сохраняет/обновляет пользователя, шлёт приветствие + главное меню
- **Inline-клавиатура**: Каталог → Категория → Товар → Заказать → Подтвердить
- При подтверждении создаётся `Order` со статусом `new`, клиенту уходят реквизиты
- Если задан `ADMIN_CHAT_ID`, администратору приходит уведомление о новом заказе
- Любой текст от пользователя логируется в `Message` (direction = `in`) и предлагается меню
- Рассылка (`/api/telegram/broadcast`) идёт по всем `BotUser` с throttle 50 мс между сообщениями

---

## 🔒 Безопасность

- ✅ Секреты (`TELEGRAM_BOT_TOKEN`, `DATABASE_URL`) хранятся только в Vercel Environment Variables
- ✅ `.env*` в `.gitignore`; коммитится только `.env.example` как шаблон
- ✅ Webhook возвращает `200` даже при ошибке обработчика — чтобы Telegram не спамил ретраями
- ⚠️ Для production-проверки подлинности webhook-запросов рекомендуется включить
  `secret_token` в `setWebhook` и проверять заголовок `X-Telegram-Bot-Api-Secret-Token`.
  Это опциональное улучшение — базовая логика работает и без него.

---

## 📜 Скрипты

| Команда | Что делает |
|---------|------------|
| `bun run dev` | Dev-сервер на `:3000` |
| `bun run lint` | ESLint |
| `bun run build` | Production-сборка Next.js |
| `bun run db:push` | Применить схему Prisma к БД |
| `bun run db:generate` | Сгенерировать Prisma Client |
| `bun run db:seed` | Заполнить БД демо-данными (6 товаров + настройки) |
| `bun run db:migrate` | Создать миграцию (dev) |
| `bun run db:reset` | Сбросить БД и миграции |

---

## 🆘 Частые вопросы

**Бот не отвечает на `/start`**
→ Проверьте вкладку «Бот» в панели: статус должен быть «Бот подключён», webhook URL должен совпадать с вашим доменом. Переподключите webhook кнопкой.

**Фото товара не приходит в Telegram**
→ Telegram требует абсолютный публичный URL. Задайте `NEXT_PUBLIC_APP_URL` в Vercel env vars (значение должно быть `https://<домен>.vercel.app`) и переустановите webhook.

**Заказы не появляются в панели**
→ Откройте DevTools → Network. `/api/orders` должен вернуть `200`. Если 500 — проверьте логи Vercel Functions, скорее всего проблема с `DATABASE_URL`.

**Vercel build падает на Prisma**
→ Убедитесь, что `DATABASE_URL` указывает на PostgreSQL (не SQLite-файл) и `provider = "postgresql"` в `prisma/schema.prisma`.

---

## 📄 Лицензия

MIT — используйте свободно для своих проектов.
