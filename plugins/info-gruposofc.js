let handler  = async (m, { conn, usedPrefix: _p }) => {
let texto = `*✅ BIENVENIDO A LOS GRUPOS OFICIALES*

  1) *${info.nn}*
  
  2) *${info.nn2}*

➤ Grupo del Colaboracion LoliBot & GataBot-MD
 *${info.nn3}*

➤ Grupo soporte para responder a tu dudas/sugerencia/etc
${info.nn6}
 
➤ Infomarte sobre las nuevas actualizaciones/novedades/test sobre LoliBot aqui:
*${nna}*

 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

⇶⃤꙰𝑬𝒏𝒍𝒂𝒄𝒆 𝒍𝒐𝒍𝒊𝒃𝒐𝒕ꦿ⃟⃢
*${info.nn4}*

ᥫ᭡༶A༶T༶M༶M༶ᰔᩚ
*${info.nn5}*

๋࣭ 𝑇ℎ𝑒 𝑊𝑜𝑟𝑙𝑑 (｡•̀ᴗ-)✧💛
https://chat.whatsapp.com/Csf3E6f2teh2wy3LXfbYRS?mode=ems_copy_c`.trim() 
conn.reply(m.chat, texto, m) 
//conn.fakeReply(m.chat, info, '0@s.whatsapp.net', '𝙏𝙝𝙚-𝙇𝙤𝙡𝙞𝘽𝙤𝙩-𝙈𝘿', 'status@broadcast')
}
handler.help = ['grupos']
handler.tags = ['main']
handler.command = /^(linkgc|grupos|gruposgatabot|gatabotgrupos|gruposdegatabot|groupofc|gruposgb|grupogb|groupgb)$/i
handler.register = true 
export default handler
