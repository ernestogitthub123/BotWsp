function shuffle(array = []) {
  const copy = [...array]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
  }
  return copy
}

function chunkParticipants(participants = [], size = 2) {
  const groups = []
  for (let index = 0; index < participants.length; index += size) {
    groups.push(participants.slice(index, index + size))
  }
  return groups
}

async function normalizeParticipants(conn, participants = [], botId = '', botLid = '') {
  const unique = new Map()

  for (const participant of participants) {
    const cleanId = String(participant?.id || '').replace(/:\d+/, '')
    if (!cleanId) continue
    if (cleanId === botId || cleanId === botLid) continue
    const phoneNumber = String(participant?.phoneNumber || '').replace(/[^0-9]/g, '')
    const mentionId = phoneNumber ? `${phoneNumber}@s.whatsapp.net` : cleanId
    if (mentionId === botId || mentionId === botLid) continue
    if (unique.has(mentionId)) continue

    let displayName = ''
    try {
      displayName = await conn.getName(mentionId)
    } catch {}

    const fallbackName = participant?.notify || participant?.name || phoneNumber || cleanId.split('@')[0]
    unique.set(mentionId, {
      id: mentionId,
      label: displayName || fallbackName,
      number: phoneNumber || mentionId.split('@')[0]
    })
  }

  return [...unique.values()]
}

function buildHalfMessage(participants = [], subject = 'Grupo') {
  const shuffled = shuffle(participants)
  const splitIndex = Math.ceil(shuffled.length / 2)
  const groupOne = shuffled.slice(0, splitIndex)
  const groupTwo = shuffled.slice(splitIndex)

  let text = `*Mitad aleatoria de ${subject}*\n\n`
  text += `*Grupo 1 (${groupOne.length}):*\n`
  text += groupOne.map((user) => `- @${user.number}  ${user.label}`).join('\n')
  text += `\n\n*Grupo 2 (${groupTwo.length}):*\n`
  text += groupTwo.map((user) => `- @${user.number}  ${user.label}`).join('\n')

  return {
    text,
    mentions: [...groupOne, ...groupTwo].map((user) => user.id)
  }
}

function buildSizedGroupsMessage(participants = [], size = 2, subject = 'Grupo') {
  const shuffled = shuffle(participants)
  const groups = chunkParticipants(shuffled, size)
  let text = `*Grupos aleatorios de ${size} en ${subject}*\n\n`

  groups.forEach((group, index) => {
    text += `*Grupo ${index + 1} (${group.length}):*\n`
    text += group.map((user) => `- @${user.number}  ${user.label}`).join('\n')
    if (index < groups.length - 1) text += '\n\n'
  })

  return {
    text,
    mentions: shuffled.map((user) => user.id)
  }
}

const handler = async (m, { conn, metadata, command }) => {
  const botId = conn.user?.id?.replace(/:\d+/, '') || ''
  const botLid = conn.user?.lid?.replace(/:\d+/, '') || ''
  const normalizedParticipants = await normalizeParticipants(conn, metadata?.participants || [], botId, botLid)

  if (normalizedParticipants.length < 2) {
    return m.reply('No hay suficientes integrantes para armar grupos.')
  }

  let payload

  if (/^grupomitad$/i.test(command)) {
    payload = buildHalfMessage(normalizedParticipants, metadata?.subject || 'el grupo')
  } else if (/^formargrupos2$/i.test(command)) {
    payload = buildSizedGroupsMessage(normalizedParticipants, 2, metadata?.subject || 'el grupo')
  } else if (/^formargrupos3$/i.test(command)) {
    if (normalizedParticipants.length < 3) {
      return m.reply('Se necesitan al menos 3 integrantes para usar este comando.')
    }
    payload = buildSizedGroupsMessage(normalizedParticipants, 3, metadata?.subject || 'el grupo')
  } else if (/^formargrupos4$/i.test(command)) {
    if (normalizedParticipants.length < 4) {
      return m.reply('Se necesitan al menos 4 integrantes para usar este comando.')
    }
    payload = buildSizedGroupsMessage(normalizedParticipants, 4, metadata?.subject || 'el grupo')
  }

  if (!payload) return

  await conn.sendMessage(m.chat, {
    text: payload.text,
    mentions: payload.mentions
  }, { quoted: m })
}

handler.help = ['grupomitad', 'formargrupos2', 'formargrupos3', 'formargrupos4']
handler.tags = ['group']
handler.command = /^(grupomitad|formargrupos2|formargrupos3|formargrupos4)$/i
handler.group = true
handler.register = true

export default handler
