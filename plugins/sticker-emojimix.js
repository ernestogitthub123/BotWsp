import { sticker } from '../lib/sticker.js'
import { db } from '../lib/postgres.js'
import fetch from 'node-fetch'
import { enforceStickerCooldown } from '../lib/sticker-cooldown.js'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
const userResult = await db.query('SELECT sticker_packname, sticker_author FROM usuarios WHERE id = $1', [m.sender])
const user = userResult.rows[0] || {}
let f = user.sticker_packname || global.info.packname
let g = (user.sticker_packname && user.sticker_author ? user.sticker_author : (user.sticker_packname && !user.sticker_author ? '' : global.info.author))
if (!args[0]) return m.reply(`⚠️ Debes usar 2 emojis y en medio usar el *+*\n• Ejemplo :\n*${usedPrefix + command}* 😺+😆`)
if (!await enforceStickerCooldown(m, 'crear otro sticker')) return

try {
let [emoji1, emoji2] = text.split`+`
let anu = await fetchJson(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`)
for (let res of anu.results) {
let stiker = await sticker(false, res.url, f, g)
conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, true, { contextInfo: { 'forwardingScore': 200, 'isForwarded': false, externalAdReply: { showAdAttribution: false, title: info.wm, body: ``, mediaType: 2, sourceUrl: info.md, thumbnail: m.pp } } }, { quoted: m })
}
} catch (e) {
console.log(e)
}}
handler.help = ['emojimix'].map(v => v + ' emot1|emot2>')
handler.tags = ['sticker']
handler.command = /^(emojimix|emogimix|combinaremojis|crearemoji|emojismix|emogismix)$/i
handler.register = true
handler.limit = 1
export default handler

const fetchJson = (url, options) => new Promise(async (resolve, reject) => {
fetch(url, options)
.then(response => response.json())
.then(json => {
resolve(json)
})
.catch((err) => {
reject(err)
})})
