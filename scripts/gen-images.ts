/**
 * Generate product cover images for the gym trainer bot catalog.
 * Saves to public/images/*.jpg so the dashboard can render them and
 * (once deployed to Vercel) Telegram can fetch them.
 */
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUT_DIR = path.resolve(process.cwd(), 'public/images')

const items: { file: string; prompt: string }[] = [
  {
    file: 'product-course.jpg',
    prompt:
      'Professional fitness photography: muscular athlete doing barbell back squat in a modern gym, dramatic side lighting, dark moody background, high detail, magazine cover quality',
  },
  {
    file: 'product-cut.jpg',
    prompt:
      'Professional fitness photography: lean athletic person doing battle ropes in a bright modern gym, defined muscle, energetic, clean background, high detail',
  },
  {
    file: 'product-pt.jpg',
    prompt:
      'Personal trainer coaching a client in a modern gym, hands-on correction of exercise technique, professional photography, warm natural light, high detail',
  },
  {
    file: 'product-nutrition.jpg',
    prompt:
      'Healthy meal prep with chicken, rice and vegetables on a clean kitchen counter, top-down flat lay, bright natural light, professional food photography, high detail',
  },
  {
    file: 'product-strength.jpg',
    prompt:
      'Powerlifter deadlifting heavy barbell with chalk dust in air, intense focus, dark industrial gym background, dramatic lighting, professional sports photography, high detail',
  },
  {
    file: 'product-home.jpg',
    prompt:
      'Athletic person doing bodyweight push-up in a bright minimal living room at home, morning light, modern interior, professional fitness photography, high detail',
  },
]

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
  const zai = await ZAI.create()
  for (const item of items) {
    const out = path.join(OUT_DIR, item.file)
    if (fs.existsSync(out) && fs.statSync(out).size > 10000) {
      console.log('skip (exists):', item.file)
      continue
    }
    try {
      const resp = await zai.images.generations.create({
        prompt: item.prompt,
        size: '1024x1024',
      })
      const b64 = resp.data[0].base64
      fs.writeFileSync(out, Buffer.from(b64, 'base64'))
      console.log('ok:', item.file, fs.statSync(out).size, 'bytes')
    } catch (e) {
      console.error('fail:', item.file, e)
    }
  }
}

main()
