const STICKER_COOLDOWN_MS = 3 * 60 * 1000;
const stickerCooldowns = new Map();

function formatRemaining(ms = 0) {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (!minutes) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function getStickerCooldownRemaining(userId) {
  const lastUse = stickerCooldowns.get(userId) || 0;
  return Math.max(0, lastUse + STICKER_COOLDOWN_MS - Date.now());
}

export async function enforceStickerCooldown(m, actionText = 'crear otro sticker') {
  const remaining = getStickerCooldownRemaining(m.sender);
  if (remaining > 0) {
    await m.reply(`🕓 Espera ${formatRemaining(remaining)} para volver a ${actionText}.`);
    return false;
  }

  stickerCooldowns.set(m.sender, Date.now());
  return true;
}
