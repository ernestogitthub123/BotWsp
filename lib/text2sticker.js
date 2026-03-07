import { createCanvas, registerFont } from 'canvas';
import sharp from 'sharp';
import path from 'path';
import GIFEncoder from 'gifencoder';

// Puedes registrar una fuente personalizada si quieres
// registerFont(path.join(process.cwd(), 'media', 'tu-fuente.ttf'), { family: 'CustomFont' });

/**
 * Genera un sticker de texto (sin movimiento) en formato WebP
 * @param {string} text - Texto a convertir en sticker
 * @param {object} [opts] - Opciones de personalización
 * @returns {Promise<Buffer>} - Buffer del sticker en WebP
 */
export async function textToSticker(text, opts = {}) {
  const width = opts.width || 512;
  const height = opts.height || 512;
  const fontSize = opts.fontSize || 64;
  const fontFamily = opts.fontFamily || 'Arial';
  const bgColor = opts.bgColor || 'rgba(0,0,0,0)';
  const textColor = opts.textColor || '#fff';

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Texto
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 8;
  ctx.fillText(text, width / 2, height / 2);

  // Convierte a WebP
  const pngBuffer = canvas.toBuffer('image/png');
  const webpBuffer = await sharp(pngBuffer).webp().toBuffer();
  return webpBuffer;
}

/**
 * Genera un sticker animado de texto (tipo bratvid) en formato WebP animado
 * @param {string} text - Texto a convertir en sticker animado
 * @param {object} [opts] - Opciones de personalización
 * @returns {Promise<Buffer>} - Buffer del sticker animado en WebP
 */
export async function textToAnimatedSticker(text, opts = {}) {
  const width = opts.width || 512;
  const height = opts.height || 512;
  const fontSize = opts.fontSize || 64;
  const fontFamily = opts.fontFamily || 'Arial';
  const bgColor = opts.bgColor || '#000';
  const textColor = opts.textColor || '#fff';
  const frames = opts.frames || 10; // Número de frames
  const delay = opts.delay || 100; // Delay entre frames en ms

  const encoder = new GIFEncoder(width, height);
  encoder.start();
  encoder.setRepeat(0); // Repetir indefinidamente
  encoder.setDelay(delay);
  encoder.setQuality(10);

  for (let i = 0; i < frames; i++) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fondo negro
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Texto con animación simple: mover de izquierda a derecha
    const x = (width / frames) * i;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 8;
    ctx.fillText(text, x, height / 2);

    encoder.addFrame(ctx);
  }

  encoder.finish();

  // Obtener el buffer del GIF
  const gifBuffer = encoder.out.getData();

  // Convertir GIF a WebP animado usando sharp
  const webpBuffer = await sharp(gifBuffer, { animated: true }).webp({ loop: 0 }).toBuffer();
  return webpBuffer;
}
