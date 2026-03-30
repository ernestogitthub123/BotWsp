import { createLoveSticker } from '../lib/love-sticker.js'
import { addExif } from '../lib/sticker.js'
import { enforceStickerCooldown } from '../lib/sticker-cooldown.js'

function parseCouple(text = '') {
  const parts = String(text).split(/\s+x\s+/i)
  if (parts.length < 2) return null

  const left = parts.shift()?.trim()
  const right = parts.join(' x ').trim()

  if (!left || !right) return null
  return [left, right]
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const pair = parseCouple(text)
  if (!pair) {
    return m.reply(`Usa el formato:\n*${usedPrefix + command} Nombre x Nombre*`)
  }

  const [name1, name2] = pair
  const percent = Math.floor(Math.random() * 100) + 1

  try {
    if (!await enforceStickerCooldown(m, 'crear otro sticker de ship')) {
      return
    }

    const webpBuffer = await createLoveSticker(name1, name2, percent)
    let sticker = webpBuffer

    try {
      const exifSticker = await addExif(webpBuffer, global.info?.packname || 'LoliBot', global.info?.author || 'LoliBot')
      if (Buffer.isBuffer(exifSticker) && exifSticker.length > 0) {
        sticker = exifSticker
      }
    } catch (exifError) {
      console.error('Error agregando EXIF a nivelamor:', exifError)
    }

    await conn.sendFile(m.chat, sticker, 'nivelamor.webp', '', m, true, { quoted: m })

    if (percent === 100) {
      await m.reply(`*${name1} x ${name2}* tienen *100%* de compatibilidad.`)
    }
  } catch (e) {
    console.error('Error nivelamor:', e)
    m.reply('No pude generar el sticker de nivelamor.')
  }
}

handler.help = ['nivelamor Nombre x Nombre', 'ship Nombre x Nombre']
handler.tags = ['sticker']
handler.command = /^(nivelamor|ship|shippear)$/i
handler.register = true

export default handler
