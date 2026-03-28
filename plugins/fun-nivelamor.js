import { createLoveSticker } from '../lib/love-sticker.js'
import { addExif } from '../lib/sticker.js'

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
    const webpBuffer = await createLoveSticker(name1, name2, percent)
    const sticker = await addExif(webpBuffer, global.info?.packname || 'LoliBot', global.info?.author || 'LoliBot')

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
