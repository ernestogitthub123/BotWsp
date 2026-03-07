import { sticker } from '../lib/sticker.js'
import { textToSticker, textToAnimatedSticker } from '../lib/text2sticker.js'
import { db } from '../lib/postgres.js';
let handler = async(m, { conn, text, args, usedPrefix, command }) => {
const userResult = await db.query('SELECT sticker_packname, sticker_author FROM usuarios WHERE id = $1', [m.sender]);
const user = userResult.rows[0] || {};
let f = user.sticker_packname || global.info.packname;
let g = (user.sticker_packname && user.sticker_author ? user.sticker_author : (user.sticker_packname && !user.sticker_author ? '' : global.info.author));
if (!text) return m.reply(`⚠️ 𝙀𝙨𝙘𝙧𝙞𝙗𝙖 𝙥𝙖𝙧𝙖 𝙦𝙪𝙚 𝙚𝙡 𝙩𝙚𝙭𝙩𝙤 𝙨𝙚 𝙘𝙤𝙣𝙫𝙞𝙚𝙧𝙩𝙖 𝙚𝙡 𝙨𝙩𝙞𝙘𝙠𝙚𝙧\n𝙀𝙟𝙚𝙢𝙥𝙡𝙤\n*${usedPrefix + command}* Nuevo Sticker`)
let teks = encodeURI(text)
conn.fakeReply(m.chat, `Calma crack estoy haciendo tu texto a sticker 👏\n\n> *Esto puede demorar unos minutos*`, '0@s.whatsapp.net', `No haga spam gil`, 'status@broadcast')

if (command == 'attp') {
if (text.length > 40) return m.reply(`⚠️ El texto no puede tener más de 40 caracteres.\n\n✍️ Intenta con algo más corto.`)
//let stiker = await sticker(null,`${info.fgmods.url}/maker/attp?text=${teks}&apikey=${info.fgmods.key}`, f, g)
let res = await fetch(`https://api.neoxr.eu/api/attp?text=${teks}%21&color=%5B%22%23FF0000%22%2C+%22%2300FF00%22%2C+%22%230000FF%22%5D&apikey=${info.neoxr.key}`)
let json = await res.json()
if (!json.status) return m.reply('Ufff la puta api se cayo 😒 pura mamada vuelve intentarlo mas tarde')
let stiker = await sticker(null, json.data.url, f, g)
conn.sendFile(m.chat, stiker, 'sticker.webp', '',m, true, { contextInfo: { 'forwardingScore': 200, 'isForwarded': false, externalAdReply:{ showAdAttribution: false, title: info.wm, body: info.vs, mediaType: 2, sourceUrl: info.md, thumbnail: m.pp}}}, { quoted: m })
}

if (command == 'ttp' || command == 'brat') {
	if (text.length > 300) return m.reply(`⚠️ El texto no puede tener más de 300 caracteres.\n\n✍️ Intenta con algo más corto.`)
	try {
		let webpBuffer = await textToSticker(text, {
			width: 512,
			height: 512,
			fontSize: 64,
			fontFamily: 'Arial',
			bgColor: 'rgba(0,0,0,0)',
			textColor: '#fff'
		});
		conn.sendFile(m.chat, webpBuffer, 'sticker.webp', '', m, true, { contextInfo: { 'forwardingScore': 200, 'isForwarded': false, externalAdReply: { showAdAttribution: false, title: info.wm, body: info.vs, mediaType: 2, sourceUrl: info.md, thumbnail: m.pp }}}, { quoted: m });
	} catch (e) {
		m.reply('Ocurrió un error generando el sticker localmente.');
	}
}

if (command == 'brat2' || command == 'bratvid') {
  if (text.length > 250) return m.reply(`⚠️ El texto no puede tener más de 250 caracteres.\n\n✍️ Intenta con algo más corto.`)
  try {
    let webpBuffer = await textToAnimatedSticker(text, {
      width: 512,
      height: 512,
      fontSize: 64,
      fontFamily: 'Arial',
      bgColor: '#000',
      textColor: '#fff',
      frames: 10,
      delay: 100
    });
    conn.sendFile(m.chat, webpBuffer, 'sticker.webp', '', m, true, { contextInfo: { 'forwardingScore': 200, 'isForwarded': false, externalAdReply: { showAdAttribution: false, title: info.wm, body: info.vs, mediaType: 2, sourceUrl: info.md, thumbnail: m.pp }}}, { quoted: m });
  } catch (e) {
    console.error(e);
    m.reply('Ocurrió un error generando el sticker animado localmente.');
  }
}
}
handler.help = ['attp', 'brat', 'bratvid'];
handler.tags = ['sticker']
handler.command = /^(attp|ttp|ttp2|ttp3|ttp4|attp2|brat|brat2|bratvid)$/i
handler.register = true
export default handler
