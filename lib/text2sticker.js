import { createCanvas } from 'canvas';
import sharp from 'sharp';
import GIFEncoder from 'gifencoder';

function sanitizeText(text = '') {
  return String(text)
    .replace(/\s+/g, ' ')
    .trim();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const value = String(hex).replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((char) => char + char).join('')
    : value;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function blendHexColors(from, to, t) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const r = Math.round(lerp(start.r, end.r, t));
  const g = Math.round(lerp(start.g, end.g, t));
  const b = Math.round(lerp(start.b, end.b, t));
  return `rgb(${r}, ${g}, ${b})`;
}

function createLetterGradient(ctx, colors, width, shift = 0) {
  if (!Array.isArray(colors) || !colors.length) return '#ffffff';

  if (colors.length === 1) return colors[0];

  const offset = width * shift;
  const gradient = ctx.createLinearGradient(-offset, 0, width - offset, 0);
  const step = 1 / (colors.length - 1);
  colors.forEach((color, index) => {
    gradient.addColorStop(index * step, color);
  });

  return gradient;
}

function fitTextLayout(ctx, text, opts) {
  const {
    width,
    height,
    fontFamily,
    maxFontSize,
    minFontSize,
    paddingX,
    paddingY,
    lineHeightFactor,
    fontWeight
  } = opts;

  const normalized = sanitizeText(text) || ' ';
  const words = normalized.split(' ');
  const maxTextWidth = width - paddingX * 2;
  const maxTextHeight = height - paddingY * 2;

  const wrapText = () => {
    const lines = [];
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxTextWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) lines.push(line);
    return lines;
  };

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 2) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const lines = wrapText();
    const lineHeight = Math.ceil(fontSize * lineHeightFactor);
    const totalHeight = lines.length * lineHeight;
    const widestLine = Math.max(...lines.map(line => ctx.measureText(line).width));

    if (widestLine <= maxTextWidth && totalHeight <= maxTextHeight) {
      return { lines, fontSize, lineHeight, totalHeight };
    }
  }

  ctx.font = `${fontWeight} ${minFontSize}px ${fontFamily}`;
  const lines = wrapText();
  const lineHeight = Math.ceil(minFontSize * lineHeightFactor);
  return {
    lines,
    fontSize: minFontSize,
    lineHeight,
    totalHeight: lines.length * lineHeight
  };
}

function drawBackground(ctx, width, height, bgColor) {
  ctx.clearRect(0, 0, width, height);
  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawText(ctx, layout, opts = {}) {
  const {
    width,
    height,
    fontFamily,
    fontWeight,
    paddingX = 44,
    textColor,
    strokeColor,
    strokeWidth,
    scale = 1,
    align = 'center',
    valign = 'middle',
    glowColor = 'transparent',
    glowBlur = 0,
    opacity = 1,
    offsetX = 0,
    offsetY = 0,
    rotation = 0
  } = opts;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  if (rotation) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.translate(-width / 2, -height / 2);
  }
  ctx.scale(scale, scale);
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.globalAlpha = opacity;
  ctx.fillStyle = textColor;
  ctx.strokeStyle = strokeColor || 'transparent';
  ctx.lineWidth = strokeWidth || 0;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;
  ctx.font = `${fontWeight} ${layout.fontSize}px ${fontFamily}`;

  const startY = valign === 'top'
    ? Math.max(0, ((opts.paddingY ?? 44) - layout.fontSize * 0.12))
    : (height / 2 - layout.totalHeight / 2);
  const x = align === 'left' ? paddingX : width / 2;
  layout.lines.forEach((line, index) => {
    const y = startY + index * layout.lineHeight;
    if (strokeWidth) ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  });

  ctx.restore();
}

function getTextOrigin(layout, opts = {}) {
  const {
    width,
    height,
    paddingX = 44,
    paddingY = 44,
    align = 'center',
    valign = 'middle'
  } = opts;

  const startY = valign === 'top'
    ? Math.max(0, (paddingY - layout.fontSize * 0.12))
    : (height / 2 - layout.totalHeight / 2);
  const x = align === 'left' ? paddingX : width / 2;

  return { x, startY };
}

function getWordPlacements(ctx, layout, opts = {}) {
  const { fontFamily, fontWeight, align = 'left' } = opts;
  ctx.save();
  ctx.font = `${fontWeight} ${layout.fontSize}px ${fontFamily}`;

  const { x, startY } = getTextOrigin(layout, opts);
  const placements = [];

  layout.lines.forEach((line, lineIndex) => {
    const words = line.split(' ').filter(Boolean);
    const lineY = startY + lineIndex * layout.lineHeight;
    const lineWidth = ctx.measureText(line).width;
    const baseX = align === 'left' ? x : x - lineWidth / 2;
    let cursorX = baseX;

    words.forEach((word, wordIndex) => {
      const token = wordIndex < words.length - 1 ? `${word} ` : word;
      const tokenWidth = ctx.measureText(token).width;
      const wordWidth = ctx.measureText(word).width;
      placements.push({
        text: word,
        x: cursorX,
        y: lineY,
        width: wordWidth
      });
      cursorX += tokenWidth;
    });
  });

  ctx.restore();
  return placements;
}

function drawWords(ctx, placements, opts = {}) {
  const {
    fontFamily,
    fontWeight,
    fontSize,
    textColor = '#000000',
    glowColor = 'transparent',
    glowBlur = 0,
    opacity = 1
  } = opts;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor;
  ctx.globalAlpha = opacity;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;

  placements.forEach((word) => {
    ctx.fillText(word.text, word.x + (word.offsetX || 0), word.y + (word.offsetY || 0));
  });

  ctx.restore();
}

async function gifToAnimatedWebp(gifBuffer) {
  return sharp(gifBuffer, { animated: true })
    .webp({ animated: true, loop: 0, quality: 82, effort: 2 })
    .toBuffer();
}

function hexToGifColor(hex) {
  return Number.parseInt(String(hex).replace('#', ''), 16);
}

function createGifEncoder(width, height, delay, transparentColor = null) {
  const encoder = new GIFEncoder(width, height);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(delay);
  encoder.setQuality(20);
  if (transparentColor) encoder.setTransparent(hexToGifColor(transparentColor));
  return encoder;
}

export async function textToSticker(text, opts = {}) {
  const width = opts.width || 512;
  const height = opts.height || 512;
  const fontFamily = opts.fontFamily || 'Arial';
  const fontWeight = opts.fontWeight || 'normal';
  const bgColor = opts.bgColor || '#ffffff';
  const textColor = opts.textColor || '#000000';
  const paddingX = opts.paddingX || 32;
  const paddingY = opts.paddingY || 40;
  const maxFontSize = opts.fontSize || 118;
  const minFontSize = opts.minFontSize || 28;
  const lineHeightFactor = opts.lineHeightFactor || 1.04;
  const strokeColor = opts.strokeColor || null;
  const strokeWidth = opts.strokeWidth || 0;
  const align = opts.align || 'center';

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, width, height, bgColor);

  const layout = fitTextLayout(ctx, text, {
    width,
    height,
    fontFamily,
    maxFontSize,
    minFontSize,
    paddingX,
    paddingY,
    lineHeightFactor,
    fontWeight
  });

  drawText(ctx, layout, {
    width,
    height,
    fontFamily,
    fontWeight,
    paddingX,
    textColor,
    strokeColor,
    strokeWidth,
    align
  });

  return sharp(canvas.toBuffer('image/png')).webp({ quality: 95 }).toBuffer();
}

export async function textToAnimatedSticker(text, opts = {}) {
  const normalized = sanitizeText(text);
  const width = opts.width || 512;
  const height = opts.height || 512;
  const fontFamily = opts.fontFamily || 'Arial';
  const fontWeight = opts.fontWeight || 'normal';
  const bgColor = opts.bgColor || '#000000';
  const textColor = opts.textColor || '#ffffff';
  const paddingX = opts.paddingX || 32;
  const paddingY = opts.paddingY || 40;
  const maxFontSize = opts.fontSize || 118;
  const minFontSize = opts.minFontSize || 28;
  const lineHeightFactor = opts.lineHeightFactor || 1.04;
  const delay = opts.delay || 90;
  const transitionFrames = clamp(opts.transitionFrames || 8, 1, 6);
  const holdFrames = clamp(opts.holdFrames || 4, 0, 4);
  const finalHoldFrames = clamp(opts.finalHoldFrames || 8, 1, 6);
  const align = opts.align || 'center';
  const palette = opts.palette || ['#ffffff', '#31f2ff', '#8dff5f', '#ffd33d', '#ff5f87'];
  const mode = opts.mode || 'chaos';
  const maxAssembleSteps = clamp(opts.maxAssembleSteps || 6, 1, 8);
  const maxPaletteFrames = clamp(opts.maxPaletteFrames || palette.length, 2, 8);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const encoder = createGifEncoder(width, height, delay);

  const layout = fitTextLayout(ctx, normalized || '...', {
    width,
    height,
    fontFamily,
    maxFontSize,
    minFontSize,
    paddingX,
    paddingY,
    lineHeightFactor,
    fontWeight
  });

  if (mode === 'assemble') {
    const words = getWordPlacements(ctx, layout, {
      width,
      height,
      paddingX,
      paddingY,
      align,
      valign: align === 'left' ? 'top' : 'middle',
      fontFamily,
      fontWeight
    });

    const steps = Math.min(words.length, maxAssembleSteps);
    const chunkSize = Math.max(1, Math.ceil(words.length / steps));

    for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
      const visibleCount = Math.min(words.length, (stepIndex + 1) * chunkSize);
      const activeWord = words[visibleCount - 1];
      if (!activeWord) continue;

      for (let frameIndex = 0; frameIndex < Math.min(transitionFrames, 3); frameIndex += 1) {
        const t = transitionFrames === 1 ? 1 : frameIndex / (transitionFrames - 1);
        const eased = easeOutCubic(t);
        const visibleWords = words.slice(0, Math.max(0, visibleCount - 1)).map((word) => ({ ...word }));

        visibleWords.push({
          ...activeWord,
          offsetX: lerp(28, 0, eased),
          offsetY: lerp(-18, 0, eased)
        });

        drawBackground(ctx, width, height, bgColor);
        drawWords(ctx, visibleWords, {
          fontFamily,
          fontWeight,
          fontSize: layout.fontSize,
          textColor,
          glowColor: 'transparent',
          glowBlur: 0,
          opacity: 1
        });
        encoder.addFrame(ctx);
      }
    }

    for (let i = 0; i < finalHoldFrames; i += 1) {
      drawBackground(ctx, width, height, bgColor);
      drawText(ctx, layout, {
        width,
        height,
        fontFamily,
        fontWeight,
        paddingX,
        paddingY,
        textColor,
        scale: 1,
        align,
        valign: align === 'left' ? 'top' : 'middle',
        glowColor: 'transparent',
        glowBlur: 0
      });
      encoder.addFrame(ctx);
    }

    encoder.finish();
    return gifToAnimatedWebp(encoder.out.getData());
  }

  for (let i = 0; i < transitionFrames; i += 1) {
    const t = transitionFrames === 1 ? 1 : i / (transitionFrames - 1);
    const eased = easeOutCubic(t);
    const scale = lerp(0.22, 1, eased);
    const opacity = lerp(0.18, 1, eased);
    const offsetY = lerp(height * 0.24, 0, eased);
    const glowBlur = Math.round(lerp(34, 10, eased));
    const primary = palette[i % palette.length];
    const secondary = palette[(i + 2) % palette.length];

    drawBackground(ctx, width, height, bgColor);
    drawText(ctx, layout, {
      width,
      height,
      fontFamily,
      fontWeight,
      paddingX,
      paddingY,
      textColor: blendHexColors(primary, secondary, 0.5),
      scale,
      align,
      valign: align === 'left' ? 'top' : 'middle',
      glowColor: primary,
      glowBlur,
      opacity,
      offsetY
    });
    encoder.addFrame(ctx);
  }

  if (mode === 'glitch') {
    const glitchFrames = clamp(holdFrames + finalHoldFrames, 2, 8);
    for (let i = 0; i < glitchFrames; i += 1) {
      const t = glitchFrames === 1 ? 1 : i / (glitchFrames - 1);
      const primary = palette[i % palette.length];
      const secondary = palette[(i + 2) % palette.length];

      drawBackground(ctx, width, height, bgColor);
      drawText(ctx, layout, {
        width,
        height,
        fontFamily,
        fontWeight,
        paddingX,
        paddingY,
        textColor: createLetterGradient(ctx, [primary, '#ffffff', secondary], width, t * 0.35),
        scale: 1 + Math.sin(t * Math.PI * 4) * 0.035,
        align,
        valign: align === 'left' ? 'top' : 'middle',
        glowColor: primary,
        glowBlur: 18,
        rotation: Math.sin(t * Math.PI * 6) * 0.022
      });

      drawText(ctx, layout, {
        width,
        height,
        fontFamily,
        fontWeight,
        paddingX,
        paddingY,
        textColor: primary,
        scale: 1,
        align,
        valign: align === 'left' ? 'top' : 'middle',
        glowColor: 'transparent',
        glowBlur: 0,
        opacity: 0.45,
        offsetX: Math.sin(t * Math.PI * 8) * 9,
        offsetY: -3
      });

      drawText(ctx, layout, {
        width,
        height,
        fontFamily,
        fontWeight,
        paddingX,
        paddingY,
        textColor: secondary,
        scale: 1,
        align,
        valign: align === 'left' ? 'top' : 'middle',
        glowColor: 'transparent',
        glowBlur: 0,
        opacity: 0.35,
        offsetX: -Math.sin(t * Math.PI * 7) * 7,
        offsetY: 4
      });
      encoder.addFrame(ctx);
    }

    encoder.finish();
    return gifToAnimatedWebp(encoder.out.getData());
  }

  const paletteFrames = Math.min(holdFrames, maxPaletteFrames);
  for (let i = 0; i < paletteFrames; i += 1) {
    const shift = paletteFrames === 1 ? 0 : i / paletteFrames;
    drawBackground(ctx, width, height, bgColor);
    drawText(ctx, layout, {
      width,
      height,
      fontFamily,
      fontWeight,
      paddingX,
      paddingY,
      textColor: createLetterGradient(ctx, palette, width, shift),
      scale: 1,
      align,
      valign: align === 'left' ? 'top' : 'middle',
      glowColor: palette[i % palette.length],
      glowBlur: 12
    });
    encoder.addFrame(ctx);
  }

  for (let i = 0; i < finalHoldFrames; i += 1) {
    const t = finalHoldFrames === 1 ? 1 : i / (finalHoldFrames - 1);
    const pulse = 1 + Math.sin(t * Math.PI) * 0.05;
    const primary = palette[i % palette.length];
    const secondary = palette[(i + 1) % palette.length];

    drawBackground(ctx, width, height, bgColor);
    drawText(ctx, layout, {
      width,
      height,
      fontFamily,
      fontWeight,
      paddingX,
      paddingY,
      textColor: createLetterGradient(ctx, [primary, secondary, primary], width, t * 0.2),
      scale: pulse,
      align,
      valign: align === 'left' ? 'top' : 'middle',
      glowColor: primary,
      glowBlur: 16,
      rotation: Math.sin(t * Math.PI * 2) * 0.018
    });
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return gifToAnimatedWebp(encoder.out.getData());
}

export async function textToAttpSticker(text, opts = {}) {
  const normalized = sanitizeText(text);
  const width = opts.width || 512;
  const height = opts.height || 512;
  const fontFamily = opts.fontFamily || 'Arial';
  const fontWeight = opts.fontWeight || 'normal';
  const bgColor = opts.bgColor ?? '#000000';
  const paddingX = opts.paddingX || 28;
  const paddingY = opts.paddingY || 36;
  const maxFontSize = opts.fontSize || 116;
  const minFontSize = opts.minFontSize || 26;
  const lineHeightFactor = opts.lineHeightFactor || 1.05;
  const delay = opts.delay || 90;
  const cycles = clamp(opts.cycles || 3, 1, 2);
  const transparentColor = opts.transparentColor || '#ff00fe';
  const palette = opts.palette || [
    '#ff2b6e',
    '#ff8a00',
    '#ffe600',
    '#1eff8e',
    '#00c2ff',
    '#7a5cff'
  ];

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const encoder = createGifEncoder(width, height, delay, transparentColor);
  const layout = fitTextLayout(ctx, normalized, {
    width,
    height,
    fontFamily,
    maxFontSize,
    minFontSize,
    paddingX,
    paddingY,
    lineHeightFactor,
    fontWeight
  });

  const paletteFrames = palette.slice(0, clamp(opts.maxPaletteFrames || palette.length, 3, 6));
  const frames = paletteFrames.length * cycles;
  for (let i = 0; i < frames; i += 1) {
    const mainColor = paletteFrames[i % paletteFrames.length];
    const accentColor = paletteFrames[(i + 1) % paletteFrames.length];
    const shift = frames === 1 ? 0 : i / frames;

    drawBackground(ctx, width, height, bgColor);

    drawText(ctx, layout, {
      width,
      height,
      fontFamily,
      fontWeight,
      paddingX,
      paddingY,
      textColor: createLetterGradient(ctx, [mainColor, accentColor, mainColor], width, shift),
      strokeColor: null,
      strokeWidth: 0,
      scale: 1 + Math.sin((i / paletteFrames.length) * Math.PI) * 0.02,
      align: 'center',
      valign: 'middle',
      glowColor: mainColor,
      glowBlur: 8
    });

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return gifToAnimatedWebp(encoder.out.getData());
}
