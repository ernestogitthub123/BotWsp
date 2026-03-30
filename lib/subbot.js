import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import qrcode from 'qrcode';
import chalk from "chalk";
import NodeCache from 'node-cache';
import { handler, callUpdate, participantsUpdate, groupsUpdate } from '../handler.js';

if (globalThis.conns instanceof Array) console.log()
else globalThis.conns = []

const cleanJid = (jid = "") => jid.replace(/:\d+/, "").split("@")[0];
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const groupCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });
let reintentos = {}; 
const BOOT_MESSAGE_GRACE_MS = 5_000;
const HANG_TIMEOUT_MS = 8 * 60 * 1000;

export async function startSubBot(m, conn, caption = '', isCode = false, phone = '', chatId = '', commandFlags = {}) {
const id = phone || (m?.sender || '').split('@')[0];
const sessionFolder = `./jadibot/${id}`;
const senderId = m?.sender;
const bootStartedAt = Date.now();
let lastSocketActivity = Date.now();
const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
const { version } = await fetchLatestBaileysVersion();

console.info = () => {} 
const sock = makeWASocket({
  logger: pino({ level: 'silent' }),
  printQRInTerminal: false,
  browser: ['Windows', 'Chrome'],
  auth: state,
  emitOwnEvents: true,
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  getMessage: async () => '',
  msgRetryCounterCache,
  userDevicesCache,
  cachedGroupMetadata: async (jid) => groupCache.get(jid),
  version,
  keepAliveIntervalMs: 60_000,
  maxIdleTimeMs: 120_000,
});

const touchSocketActivity = () => {
  lastSocketActivity = Date.now();
};

const watchdog = setInterval(() => {
  if (Date.now() - lastSocketActivity > HANG_TIMEOUT_MS) {
    console.log(chalk.yellow(`[⚠️ SUB-BOT ${id}] Sin actividad del socket. Reiniciando...`));
    try {
      sock.end(new Error('watchdog restart'));
    } catch {}
  }
}, 60_000);

if (sock.ws && typeof sock.ws.on === 'function') {
  for (const eventName of ['open', 'close', 'error', 'message', 'ping', 'pong']) {
    sock.ws.on(eventName, touchSocketActivity);
  }
}
/*const sock = makeWASocket({
logger: pino({ level: "silent" }),
printQRInTerminal: false,
browser: ['Windows', 'Chrome'],
auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
markOnlineOnConnect: true,
generateHighQualityLinkPreview: true,
syncFullHistory: false,
getMessage: async () => "",
msgRetryCounterCache,
userDevicesCache,
cachedGroupMetadata: async (jid) => groupCache.get(jid),
version,
keepAliveIntervalMs: 55000,
maxIdleTimeMs: 60000
});*/

sock.ev.on('creds.update', () => {
  touchSocketActivity();
  return saveCreds();
});
setupGroupEvents(sock);
sock.isInit = false
let isInit = true

sock.ev.on('connection.update', async ({ connection, lastDisconnect, isNewLogin, qr }) => {
touchSocketActivity();
if (isNewLogin) sock.isInit = false
  
if (connection === 'open') {
sock.isInit = true
sock.userId = cleanJid(sock.user?.id?.split("@")[0])
const ownerName = sock.authState.creds.me?.name || "-";
sock.uptime = Date.now();
reintentos[sock.userId] = 0;
if (globalThis.conns.find(c => c.userId === sock.userId)) return;
globalThis.conns.push(sock); 

if (isCode && m?.chat && senderId.endsWith("@s.whatsapp.net")) {
conn.sendMessage(m.chat, { text: `*Conectado exitosamente con WhatsApp ✅*\n\n*💻 Bot:* +${sock.userId}\n*👤 Dueño:* ${ownerName}\n\n*Nota: Con la nueva función de auto-reinicio (Beta)*, Si el bot principal se reinicia o se desactiva, los sub-bots se reiniciarán automáticamente, asegurando que sigan activos sin interrupciones.\n\n> *Unirte a nuestro canal para informarte de todas la Actualizaciónes/novedades sobre el bot*\n${info.nna}` }, { quoted: m });
delete commandFlags[senderId];
}
console.log(chalk.bold.cyanBright(`\n✅ SUB-BOT CONECTADO: ${sock.userId} `))
}

if (connection === 'close') {
clearInterval(watchdog);
const botId = sock.userId || id;
const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason || 0;
const intentos = reintentos[botId] || 0;
reintentos[botId] = intentos + 1;

if ([401, 403].includes(reason)) {
if (intentos < 5) {
console.log(`${chalk.red(`[❌ SUB-BOT ${botId}] Conexión cerrada (código ${reason}) intento ${intentos}/5`)} → Reintentando...`);
setTimeout(() => {
startSubBot(m, conn, caption, isCode, phone, chatId, {});
}, 3000);
} else {
console.log(chalk.red(`[💥 SUB-BOT ${botId}] Falló tras 5 intentos. Eliminando sesión.`));
try {
fs.rmSync(sessionFolder, { recursive: true, force: true });
} catch (e) {
console.error(`[⚠️] No se pudo eliminar la carpeta ${sessionFolder}:`, e);
}
delete reintentos[botId];
}
return;
}

if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, DisconnectReason.timedOut, DisconnectReason.connectionReplaced].includes(reason)) {
//console.log(chalk.gray(`[📶 SUB-BOT ${botId}] Desconectado (code ${reason}) → Reintentando...`));
setTimeout(() => {
startSubBot(m, conn, caption, isCode, phone, chatId, {});
}, 3000);
return;
}

setTimeout(() => {
startSubBot(m, conn, caption, isCode, phone, chatId, {});
}, 3000);
}

if (qr && !isCode && m && conn && commandFlags[senderId]) {
try {
const qrBuffer = await qrcode.toBuffer(qr, { scale: 8 });
const msg = await conn.sendMessage(m.chat, { image: qrBuffer, caption: caption }, { quoted: m });
delete commandFlags[senderId];
setTimeout(() => conn.sendMessage(m.chat, { delete: msg.key }).catch(() => {}), 60000);
} catch (err) {
console.error("[QR Error]", err);
}}

if (qr && isCode && phone && conn && chatId && commandFlags[senderId]) {
try {
let codeGen = await sock.requestPairingCode(phone);
codeGen = codeGen.match(/.{1,4}/g)?.join("-") || codeGen;
const msg = await conn.sendMessage(chatId, { image: { url: 'https://cdn.skyultraplus.com/uploads/u4/9708a54ced0b5fed.jpg' }, caption: caption }, { quoted: m });
const msgCode = await conn.sendMessage(chatId, { text: codeGen }, { quoted: m });
delete commandFlags[senderId];
setTimeout(async () => {
try {
await conn.sendMessage(chatId, { delete: msg.key });
await conn.sendMessage(chatId, { delete: msgCode.key });
//delete commandFlags[senderId];
} catch {}
}, 60000);
} catch (err) {
console.error("[Código Error]", err);
}}
});

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

sock.ev.on("messages.upsert", async ({ messages, type }) => {
touchSocketActivity();
console.log(`[UPSERT][subbot] type=${type} count=${messages?.length || 0}`);
for (const msg of messages) {
if (!msg.message) continue;
const rawTimestamp = Number(msg.messageTimestamp || 0);
if (rawTimestamp && rawTimestamp * 1000 < bootStartedAt - BOOT_MESSAGE_GRACE_MS) {
  console.log(`[UPSERT][subbot][skip-backlog] id=${msg.key?.id || ''} ts=${rawTimestamp}`);
  continue;
}
if (rawTimestamp && (Date.now() / 1000 - rawTimestamp > 86400)) {
  console.log(`[UPSERT][subbot][skip-old] id=${msg.key?.id || ''} ts=${rawTimestamp}`);
  continue;
}
const messageId = msg.key?.id || '';
const ignoredByPrefix = (
  messageId.startsWith('NJX-') ||
  messageId.startsWith('Lyru-') ||
  messageId.startsWith('EvoGlobalBot-') ||
  (messageId.startsWith('BAE5') && messageId.length === 16) ||
  (messageId.startsWith('8SCO') && messageId.length === 20) ||
  messageId.startsWith('FizzxyTheGreat-')
);
if (ignoredByPrefix && msg.key?.fromMe) continue;

const preview = (
  msg.message?.conversation ||
  msg.message?.extendedTextMessage?.text ||
  msg.message?.imageMessage?.caption ||
  msg.message?.videoMessage?.caption ||
  ''
).slice(0, 80);
console.log(`[UPSERT][subbot] id=${messageId} fromMe=${!!msg.key?.fromMe} chat=${msg.key?.remoteJid || ''} text=${JSON.stringify(preview)}`);
try {
//const { handler } = await import("./handler.js");
await handler(sock, msg);
} catch (err) {
console.error(err);
}}
});
  
sock.ev.on("call", async (calls) => {
try {
touchSocketActivity();
//const { callUpdate } = await import("./handler.js");
for (const call of calls) {
await callUpdate(sock, call);
}} catch (err) {
console.error(chalk.red("❌ Error procesando call.update:"), err);
}
});  
}

function setupGroupEvents(sock) {
sock.ev.on("group-participants.update", async (update) => {
console.log(update)
try {
await participantsUpdate(sock, update);
} catch (err) {
console.error("[ ❌ ] SUB-BOT Error procesando group-participants.update:", err);
}});

sock.ev.on("groups.update", async (updates) => {
console.log(updates)
try {
for (const update of updates) {
await groupsUpdate(sock, update);
}} catch (err) {
console.error("[ ❌ ] SUB-BOT Error procesando groups.update:", err);
}});
}
