import { createCanvas } from 'canvas'
import sharp from 'sharp'
import GIFEncoder from 'gifencoder'

function sanitizeName(name = '') {
  return String(name).replace(/\s+/g, ' ').trim().slice(0, 24)
}

function fitText(ctx, text, maxWidth, startSize, minSize = 24) {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `normal ${size}px Arial`
    if (ctx.measureText(text).width <= maxWidth) return size
  }
  return minSize
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function drawHeartPath(ctx, cx, cy, scale) {
  const step = Math.PI / 90
  ctx.beginPath()

  for (let t = 0; t <= Math.PI * 2 + step; t += step) {
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    const px = cx + x * scale
    const py = cy - y * scale

    if (t === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }

  ctx.closePath()
}

function drawBackground(ctx, width, height, glowStrength) {
  ctx.clearRect(0, 0, width, height)

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#fff6fb')
  bg.addColorStop(0.45, '#ffe7f0')
  bg.addColorStop(1, '#ffd7e7')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const halo = ctx.createRadialGradient(width / 2, height / 2, 60, width / 2, height / 2, 310)
  halo.addColorStop(0, `rgba(255, 122, 167, ${0.12 + glowStrength * 0.16})`)
  halo.addColorStop(0.6, 'rgba(255, 170, 200, 0.08)')
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, width, height)
}

function drawHeart(ctx, percent, pulse = 1, shimmer = 0) {
  const cx = 256
  const cy = 258
  const scale = 13.6 * pulse
  const bounds = {
    left: cx - 16 * scale,
    top: cy - 17 * scale,
    width: 32 * scale,
    height: 30 * scale
  }
  const fillHeight = bounds.height * (percent / 100)

  ctx.save()
  ctx.shadowColor = 'rgba(255, 64, 120, 0.24)'
  ctx.shadowBlur = 36
  drawHeartPath(ctx, cx, cy, scale)
  const baseFill = ctx.createLinearGradient(0, bounds.top, 0, bounds.top + bounds.height)
  baseFill.addColorStop(0, '#fff9fc')
  baseFill.addColorStop(1, '#ffd8e6')
  ctx.fillStyle = baseFill
  ctx.fill()
  ctx.restore()

  ctx.save()
  drawHeartPath(ctx, cx, cy, scale)
  ctx.clip()
  const fill = ctx.createLinearGradient(0, bounds.top + bounds.height, 0, bounds.top)
  fill.addColorStop(0, '#ff2a6d')
  fill.addColorStop(0.45, '#ff5b8b')
  fill.addColorStop(1, '#ff9bbc')
  ctx.fillStyle = fill
  ctx.fillRect(bounds.left - 20, bounds.top + bounds.height - fillHeight, bounds.width + 40, fillHeight + 18)

  const gloss = ctx.createLinearGradient(bounds.left + shimmer * 120, bounds.top, bounds.left + shimmer * 120 + 120, bounds.top + bounds.height)
  gloss.addColorStop(0, 'rgba(255,255,255,0)')
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.28)')
  gloss.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gloss
  ctx.fillRect(bounds.left - 20, bounds.top - 10, bounds.width + 40, bounds.height + 20)
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.38
  drawHeartPath(ctx, cx, cy - 16, scale * 0.82)
  ctx.clip()
  const softGlow = ctx.createLinearGradient(bounds.left, bounds.top, bounds.left, bounds.top + bounds.height * 0.9)
  softGlow.addColorStop(0, 'rgba(255,255,255,0.62)')
  softGlow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = softGlow
  ctx.fillRect(bounds.left - 10, bounds.top - 20, bounds.width + 20, bounds.height * 0.6)
  ctx.restore()
}

function drawTextBlock(ctx, name1, name2, percent) {
  const safeName1 = sanitizeName(name1)
  const safeName2 = sanitizeName(name2)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(255,255,255,0.10)'
  ctx.shadowBlur = 0

  const combined = `${safeName1}  x  ${safeName2}`
  const combinedWidth = 260
  const combinedFont = fitText(ctx, combined, combinedWidth, 30, 15)

  ctx.fillStyle = '#4d0720'
  ctx.font = `normal ${combinedFont}px Arial`
  ctx.fillText(combined, 256, 287)

  const percentY = 364

  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(77, 7, 32, 0.85)'
  ctx.lineWidth = 8
  ctx.fillStyle = '#fff7fb'
  ctx.font = 'normal 38px Arial'
  ctx.strokeText(`${percent}%`, 256, percentY)
  ctx.fillText(`${percent}%`, 256, percentY)
}

async function gifToAnimatedWebp(gifBuffer) {
  return sharp(gifBuffer, { animated: true })
    .webp({ animated: true, loop: 0, quality: 92 })
    .toBuffer()
}

function createEncoder(width, height, delay) {
  const encoder = new GIFEncoder(width, height)
  encoder.start()
  encoder.setRepeat(0)
  encoder.setDelay(delay)
  encoder.setQuality(10)
  return encoder
}

function renderFrame(ctx, name1, name2, percent, pulse = 1, shimmer = 0, glow = 0.5) {
  drawBackground(ctx, 512, 512, glow)
  drawHeart(ctx, percent, pulse, shimmer)
  drawTextBlock(ctx, name1, name2, percent)
}

async function renderStaticSticker(width, height, name1, name2, percent, shimmer = 0, glow = 0.5) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  renderFrame(ctx, name1, name2, percent, 1, shimmer, glow)
  return sharp(canvas.toBuffer('image/png')).webp({ quality: 96 }).toBuffer()
}

export async function createLoveSticker(name1, name2, percent) {
  const width = 512
  const height = 512
  const clampedPercent = Math.max(1, Math.min(100, Number(percent) || 1))

  if (clampedPercent === 100) {
    try {
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')
      const encoder = createEncoder(width, height, 85)

      for (let frame = 0; frame < 16; frame += 1) {
        const t = frame / 15
        const pulse = 1 + Math.sin(t * Math.PI * 2) * 0.045
        const shimmer = t
        const glow = 0.72 + Math.sin(t * Math.PI * 2) * 0.12
        renderFrame(ctx, name1, name2, clampedPercent, pulse, shimmer, glow)
        encoder.addFrame(ctx)
      }

      encoder.finish()
      return gifToAnimatedWebp(encoder.out.getData())
    } catch (err) {
      console.error('Error generando nivelamor animado al 100%, usando fallback estatico:', err)
      return renderStaticSticker(width, height, name1, name2, clampedPercent, 1, 0.82)
    }
  }

  const glow = Math.min(0.78, 0.24 + clampedPercent / 135)
  return renderStaticSticker(width, height, name1, name2, clampedPercent, clampedPercent / 100, glow)
}
