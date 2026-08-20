import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const products = [
  {
    type: 'course',
    title: 'Курс «Гипертрофия: 12 недель к массе»',
    description:
      'Авторский видеокурс по набору мышечной массы. 36 уроков, программа тренировок, питание и восстановление. Подходит начинающим и продолжающим.',
    price: 490000,
    currency: 'RUB',
    duration: '12 недель',
    imageUrl: '/images/product-course.jpg',
    features: '36 видеоуроков|Программа тренировок|План питания|Чат поддержки|Доступ навсегда',
  },
  {
    type: 'course',
    title: 'Курс «Сушка: рельеф за 8 недель»',
    description:
      'Пошаговый курс по жиросжиганию с сохранением мышц. Включает тренировки, КБЖУ, кардио-протокол и контроль прогресса.',
    price: 390000,
    currency: 'RUB',
    duration: '8 недель',
    imageUrl: '/images/product-cut.jpg',
    features: '24 видеоурока|КБЖУ калькулятор|Кардио-протокол|Еженедельные замеры',
  },
  {
    type: 'service',
    title: 'Персональная тренировка (1 занятие)',
    description:
      'Индивидуальное занятие в зале с контролем техники, подбором весов и корректировкой программы. 60 минут.',
    price: 250000,
    currency: 'RUB',
    duration: '60 минут',
    imageUrl: '/images/product-pt.jpg',
    features: 'Разбор техники|Подбор весов|60 минут|Любой уровень',
  },
  {
    type: 'service',
    title: 'Онлайн-консультация по питанию',
    description:
      'Видеозвонок 45 минут: разбор текущего рациона, расчёт КБЖУ, план питания под вашу цель и образ жизни.',
    price: 300000,
    currency: 'RUB',
    duration: '45 минут',
    imageUrl: '/images/product-nutrition.jpg',
    features: 'Видеозвонок|Расчёт КБЖУ|Индивидуальный план|PDF-гайд',
  },
  {
    type: 'program',
    title: 'Программа «Сила 16 недель» (пауэрлифтинг)',
    description:
      'Периодизированная программа по приседу, жиму и тяге. Подходит для перехода от любителя к соревнованиям.',
    price: 550000,
    currency: 'RUB',
    duration: '16 недель',
    imageUrl: '/images/product-strength.jpg',
    features: 'Периодизация 16 нед|Видео по технике|Таблицы RPE|Корректировки онлайн',
  },
  {
    type: 'program',
    title: 'Домашняя программа «Тело без оборудования»',
    description:
      '6-недельная программа тренировок дома без инвентаря. Подходит для занятых людей и новичков.',
    price: 190000,
    currency: 'RUB',
    duration: '6 недель',
    imageUrl: '/images/product-home.jpg',
    features: 'Без инвентаря|6 недель|Видео каждого упражнения|Чат поддержки',
  },
]

async function main() {
  // Settings singleton
  await db.botSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })

  // Products — dedupe by title, preserve existing ids (safe for callback_data length)
  for (const p of products) {
    const existing = await db.product.findFirst({ where: { title: p.title } })
    if (existing) {
      await db.product.update({ where: { id: existing.id }, data: p })
    } else {
      await db.product.create({ data: p })
    }
  }

  console.log('Seed complete:', products.length, 'products')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
