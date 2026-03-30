import { textToSticker, textToAnimatedSticker, textToAttpSticker } from '../lib/text2sticker.js'
import { db } from '../lib/postgres.js'
import { enforceStickerCooldown } from '../lib/sticker-cooldown.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    const userResult = await db.query('SELECT sticker_packname, sticker_author FROM usuarios WHERE id = $1', [m.sender])
    const user = userResult.rows[0] || {}
    const f = user.sticker_packname || global.info.packname
    const g = user.sticker_packname && user.sticker_author
      ? user.sticker_author
      : (user.sticker_packname && !user.sticker_author ? '' : global.info.author)

    if (!text) {
      return m.reply(`Escribe el texto para convertirlo en sticker.\nEjemplo:\n*${usedPrefix + command}* Nuevo Sticker`)
    }

    if (!await enforceStickerCooldown(m, 'crear otro sticker')) {
      return
    }

    void f
    void g

    conn.fakeReply(
      m.chat,
      'Calma crack, estoy haciendo tu texto a sticker.\n\n> Esto puede demorar unos segundos.',
      '0@s.whatsapp.net',
      'No haga spam gil',
      'status@broadcast'
    )

    if (command === 'attp' || command === 'attp2') {
      if (text.length > 40) {
        return m.reply('El texto no puede tener mas de 40 caracteres.\n\nIntenta con algo mas corto.')
      }

      try {
        const webpBuffer = await textToAttpSticker(text, {
          width: 512,
          height: 512,
          fontSize: 112,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          paddingX: 28,
          paddingY: 36,
          bgColor: '#000000',
          delay: 60,
          cycles: 1,
          maxPaletteFrames: 4
        })

        return conn.sendFile(m.chat, webpBuffer, 'sticker.webp', '', m, true, {
          contextInfo: {
            forwardingScore: 200,
            isForwarded: false,
            externalAdReply: {
              showAdAttribution: false,
              title: info.wm,
              body: info.vs,
              mediaType: 2,
              sourceUrl: info.md,
              thumbnail: m.pp
            }
          }
        }, { quoted: m })
      } catch (e) {
        m.reply('Error generando el attp localmente: ' + (e?.message || e))
        console.error('Error attp:', e)
        return
      }
    }

    if (command === 'brat') {
      if (text.length > 300) {
        return m.reply('El texto no puede tener mas de 300 caracteres.\n\nIntenta con algo mas corto.')
      }

      try {
        const webpBuffer = await textToSticker(text, {
          width: 512,
          height: 512,
          fontSize: 118,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          paddingX: 34,
          paddingY: 40,
          bgColor: '#ffffff',
          textColor: '#000000',
          align: 'left'
        })

        return conn.sendFile(m.chat, webpBuffer, 'sticker.webp', '', m, true, {
          contextInfo: {
            forwardingScore: 200,
            isForwarded: false,
            externalAdReply: {
              showAdAttribution: false,
              title: info.wm,
              body: info.vs,
              mediaType: 2,
              sourceUrl: info.md,
              thumbnail: m.pp
            }
          }
        }, { quoted: m })
      } catch (e) {
        m.reply('Error generando el brat localmente: ' + (e?.message || e))
        console.error('Error brat:', e)
        return
      }
    }

    if (command === 'brat2' || command === 'bratvid' || command === 'bratvideo') {
      if (text.length > 250) {
        return m.reply('El texto no puede tener mas de 250 caracteres.\n\nIntenta con algo mas corto.')
      }

      try {
        const webpBuffer = await textToAnimatedSticker(text, {
          width: 512,
          height: 512,
          fontSize: 118,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          paddingX: 34,
          paddingY: 40,
          bgColor: '#ffffff',
          textColor: '#000000',
          align: 'left',
          delay: 72,
          transitionFrames: 2,
          holdFrames: 0,
          finalHoldFrames: 3,
          mode: 'assemble',
          maxAssembleSteps: 5
        })

        return conn.sendFile(m.chat, webpBuffer, 'sticker.webp', '', m, true, {
          contextInfo: {
            forwardingScore: 200,
            isForwarded: false,
            externalAdReply: {
              showAdAttribution: false,
              title: info.wm,
              body: info.vs,
              mediaType: 2,
              sourceUrl: info.md,
              thumbnail: m.pp
            }
          }
        }, { quoted: m })
      } catch (e) {
        m.reply('Error generando el bratvideo localmente: ' + (e?.message || e))
        console.error('Error bratvideo:', e)
        return
      }
    }

    if (command === 'ttp' || command === 'ttp2' || command === 'ttp3' || command === 'ttp4') {
      if (text.length > 300) {
        return m.reply('El texto no puede tener mas de 300 caracteres.\n\nIntenta con algo mas corto.')
      }

      try {
        const webpBuffer = await textToAnimatedSticker(text, {
          width: 512,
          height: 512,
          fontSize: 118,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          paddingX: 30,
          paddingY: 36,
          bgColor: '#000000',
          textColor: '#ffffff',
          align: 'center',
          delay: 70,
          transitionFrames: 4,
          holdFrames: 1,
          finalHoldFrames: 3,
          mode: 'glitch',
          palette: ['#ffffff', '#00e5ff', '#ff4d9d', '#ffe14d', '#7dff7a']
        })

        return conn.sendFile(m.chat, webpBuffer, 'sticker.webp', '', m, true, {
          contextInfo: {
            forwardingScore: 200,
            isForwarded: false,
            externalAdReply: {
              showAdAttribution: false,
              title: info.wm,
              body: info.vs,
              mediaType: 2,
              sourceUrl: info.md,
              thumbnail: m.pp
            }
          }
        }, { quoted: m })
      } catch (e) {
        m.reply('Error generando el ttp localmente: ' + (e?.message || e))
        console.error('Error ttp:', e)
        return
      }
    }
  } catch (e) {
    m.reply('Error general en el handler: ' + (e?.message || e))
    console.error('Error handler:', e)
  }
}

handler.help = ['attp', 'brat', 'bratvid', 'bratvideo', 'ttp']
handler.tags = ['sticker']
handler.command = /^(attp|ttp|ttp2|ttp3|ttp4|attp2|brat|brat2|bratvid|bratvideo)$/i
handler.register = true

export default handler
