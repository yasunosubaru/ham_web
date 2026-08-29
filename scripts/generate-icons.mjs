import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const OUTPUT_DIR = join(process.cwd(), 'public', 'icons')
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

function hamSvg(size) {
  const r = Math.round(size * 0.21)
  const fontSize = Math.round(size * 0.42)
  const y = Math.round(size * 0.63)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#409EFF"/>
      <stop offset="100%" style="stop-color:#66B1FF"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="${Math.round(size * 0.02)}" stdDeviation="${Math.round(size * 0.015)}" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)" filter="url(#shadow)"/>
  <text x="${size / 2}" y="${y}" text-anchor="middle" fill="white" font-family="-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="${Math.round(size * 0.01)}">H</text>
</svg>`
  return Buffer.from(svg)
}

async function generateIcons() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  console.log('Generating PWA icons...')

  for (const size of SIZES) {
    const svg = hamSvg(size)
    const filename = `icon-${size}x${size}.png`
    const filepath = join(OUTPUT_DIR, filename)

    await sharp(svg).png().toFile(filepath)
    console.log(`  ✅ ${filename} (${size}x${size})`)
  }

  // apple-touch-icon (180x180 — iOS standard)
  const appleSvg = hamSvg(180)
  await sharp(appleSvg).png().toFile(join(process.cwd(), 'public', 'apple-touch-icon.png'))
  console.log('  ✅ apple-touch-icon.png (180x180)')

  // favicon (32x32)
  const faviconSvg = hamSvg(32)
  await sharp(faviconSvg).png().toFile(join(process.cwd(), 'public', 'favicon.png'))
  console.log('  ✅ favicon.png (32x32)')

  console.log('\n✨ All icons generated!')
}

generateIcons().catch(console.error)
