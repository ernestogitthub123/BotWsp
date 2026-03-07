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
  let fontSize = opts.fontSize || 64;
  const fontFamily = opts.fontFamily || 'Arial';
  const bgColor = opts.bgColor || '#fff'; // Fondo blanco
  const textColor = opts.textColor || '#000'; // Texto negro

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo blanco
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Divide el texto en líneas para que no se desborde
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  }

  // Ajusta el tamaño de fuente para que el texto quepa
  let lines;
  do {
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    lines = wrapText(ctx, text, width * 0.9);
    if (lines.length * fontSize > height * 0.9) fontSize -= 4;
  } while (lines.length * fontSize > height * 0.9 && fontSize > 16);

  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 8;

  // Dibuja cada línea centrada
  const totalHeight = lines.length * fontSize;
  let y = height / 2 - totalHeight / 2 + fontSize / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], width / 2, y + i * fontSize);
  }

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
  let fontSize = opts.fontSize || 64;
  const fontFamily = opts.fontFamily || 'Arial';
  const bgColor = opts.bgColor || '#fff'; // Fondo blanco
  const textColor = opts.textColor || '#000'; // Texto negro
  const frames = opts.frames || 15; // Más frames para suavidad
  const delay = opts.delay || 200; // Más lento

  // Divide el texto en líneas para que no se desborde
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  }

  // Ajusta el tamaño de fuente para que el texto quepa
  let lines;
  do {
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    lines = wrapText(ctx, text, width * 0.9);
    if (lines.length * fontSize > height * 0.9) fontSize -= 4;
  } while (lines.length * fontSize > height * 0.9 && fontSize > 16);

  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 8;

  // Animación: cada frame mueve el texto un poco hacia arriba
  const encoder = new GIFEncoder(width, height);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(delay);
  encoder.setQuality(10);

  const totalHeight = lines.length * fontSize;
  let baseY = height / 2 - totalHeight / 2 + fontSize / 2;
  for (let f = 0; f < frames; f++) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    let y = baseY + Math.sin((f / frames) * Math.PI * 2) * 10; // Movimiento suave
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2, y + i * fontSize);
    }
    encoder.addFrame(ctx);
  }
  encoder.finish();
  const gifBuffer = encoder.out.getData();
  // Convierte GIF a WebP
  const webpBuffer = await sharp(gifBuffer).webp({ animated: true }).toBuffer();
  return webpBuffer;

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
