import { textToSticker, textToAnimatedSticker, textToAttpSticker } from '../lib/text2sticker.js'
import { db } from '../lib/postgres.js';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    const userResult = await db.query('SELECT sticker_packname, sticker_author FROM usuarios WHERE id = $1', [m.sender]);
    const user = userResult.rows[0] || {};
    const f = user.sticker_packname || global.info.packname;
    const g = user.sticker_packname && user.sticker_author
      ? user.sticker_author
      : (user.sticker_packname && !user.sticker_author ? '' : global.info.author);

    if (!text) {
      return m.reply(`âš ï¸ ð™€ð™¨ð™˜ð™§ð™žð™—ð™– ð™¥ð™–ð™§ð™– ð™¦ð™ªð™š ð™šð™¡ ð™©ð™šð™­ð™©ð™¤ ð™¨ð™š ð™˜ð™¤ð™£ð™«ð™žð™šð™§ð™©ð™– ð™šð™¡ ð™¨ð™©ð™žð™˜ð™ ð™šð™§\nð™€ð™Ÿð™šð™¢ð™¥ð™¡ð™¤\n*${usedPrefix + command}* Nuevo Sticker`);
    }

    conn.fakeReply(
      m.chat,
      `Calma crack estoy haciendo tu texto a sticker ðŸ‘\n\n> *Esto puede demorar unos minutos*`,
      '0@s.whatsapp.net',
      'No haga spam gil',
      'status@broadcast'
    );

    if (command === 'attp') {
      if (text.length > 40) {
        return m.reply(`âš ï¸ El texto no puede tener mÃ¡s de 40 caracteres.\n\nâœï¸ Intenta con algo mÃ¡s corto.`);
      }

      try {
        const webpBuffer = await textToAttpSticker(text, {
          width: 512,
          height: 512,
          fontSize: 112,
          fontFamily: 'Arial',
          fontWeight: '700',
          paddingX: 28,
          paddingY: 36,
          bgColor: null,
          delay: 90,
          cycles: 3
        });

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
        }, { quoted: m });
      } catch (e) {
        m.reply('âŒ Error generando el attp localmente: ' + (e?.message || e));
        console.error('Error attp:', e);
        return;
      }
    }

    if (command === 'ttp' || command === 'brat') {
      if (text.length > 300) {
        return m.reply(`âš ï¸ El texto no puede tener mÃ¡s de 300 caracteres.\n\nâœï¸ Intenta con algo mÃ¡s corto.`);
      }

      try {
        const webpBuffer = await textToSticker(text, {
          width: 512,
          height: 512,
          fontSize: 118,
          fontFamily: 'Arial',
          fontWeight: '600',
          paddingX: 32,
          paddingY: 40,
          bgColor: '#ffffff',
          textColor: '#000000',
          align: 'left'
        });

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
        }, { quoted: m });
      } catch (e) {
        m.reply('âŒ Error generando el sticker localmente: ' + (e?.message || e));
        console.error('Error brat:', e);
        return;
      }
    }

    if (command === 'brat2' || command === 'bratvid' || command === 'bratvideo') {
      if (text.length > 250) {
        return m.reply(`âš ï¸ El texto no puede tener mÃ¡s de 250 caracteres.\n\nâœï¸ Intenta con algo mÃ¡s corto.`);
      }

      try {
        const webpBuffer = await textToAnimatedSticker(text, {
          width: 512,
          height: 512,
          fontSize: 118,
          fontFamily: 'Arial',
          fontWeight: '600',
          paddingX: 32,
          paddingY: 40,
          bgColor: '#ffffff',
          textColor: '#000000',
          align: 'left',
          delay: 120,
          transitionFrames: 3,
          holdFrames: 2,
          finalHoldFrames: 6
        });

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
        }, { quoted: m });
      } catch (e) {
        m.reply('âŒ Error generando el sticker animado localmente: ' + (e?.message || e));
        console.error('Error bratvid:', e);
        return;
      }
    }
  } catch (e) {
    m.reply('âŒ Error general en el handler: ' + (e?.message || e));
    console.error('Error handler:', e);
  }
};

handler.help = ['attp', 'brat', 'bratvid', 'bratvideo'];
handler.tags = ['sticker'];
handler.command = /^(attp|ttp|ttp2|ttp3|ttp4|attp2|brat|brat2|bratvid|bratvideo)$/i;
handler.register = true;

export default handler;
