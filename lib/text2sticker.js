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
    glowBlur = 0
  } = opts;

  ctx.save();
  ctx.translate(0, 0);
  ctx.scale(scale, scale);
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
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

async function gifToAnimatedWebp(gifBuffer) {
  return sharp(gifBuffer, { animated: true })
    .webp({ animated: true, loop: 0, quality: 90 })
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
  encoder.setQuality(10);
  if (transparentColor) encoder.setTransparent(hexToGifColor(transparentColor));
  return encoder;
}

export async function textToSticker(text, opts = {}) {
  const width = opts.width || 512;
  const height = opts.height || 512;
  const fontFamily = opts.fontFamily || 'Arial';
  const fontWeight = opts.fontWeight || '900';
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
  const fontWeight = opts.fontWeight || '900';
  const bgColor = opts.bgColor || '#ffffff';
  const textColor = opts.textColor || '#000000';
  const paddingX = opts.paddingX || 32;
  const paddingY = opts.paddingY || 40;
  const maxFontSize = opts.fontSize || 118;
  const minFontSize = opts.minFontSize || 28;
  const lineHeightFactor = opts.lineHeightFactor || 1.04;
  const delay = opts.delay || 120;
  const transitionFrames = opts.transitionFrames || 3;
  const holdFrames = opts.holdFrames || 2;
  const finalHoldFrames = opts.finalHoldFrames || 6;
  const align = opts.align || 'center';

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const encoder = createGifEncoder(width, height, delay);

  const words = normalized.split(' ').filter(Boolean);
  const steps = words.map((_, index) => words.slice(0, index + 1).join(' '));
  if (!steps.length) steps.push(normalized || '...');

  for (const stepText of steps) {
    const layout = fitTextLayout(ctx, stepText, {
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

    for (let i = 0; i < transitionFrames; i += 1) {
      const t = transitionFrames === 1 ? 1 : i / (transitionFrames - 1);
      const eased = easeOutCubic(t);
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

    for (let i = 0; i < holdFrames; i += 1) {
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
  }

  const finalLayout = fitTextLayout(ctx, steps[steps.length - 1], {
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

  for (let i = 0; i < finalHoldFrames; i += 1) {
    drawBackground(ctx, width, height, bgColor);
    drawText(ctx, finalLayout, {
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

export async function textToAttpSticker(text, opts = {}) {
  const normalized = sanitizeText(text);
  const width = opts.width || 512;
  const height = opts.height || 512;
  const fontFamily = opts.fontFamily || 'Arial';
  const fontWeight = opts.fontWeight || '700';
  const bgColor = opts.bgColor ?? null;
  const paddingX = opts.paddingX || 28;
  const paddingY = opts.paddingY || 36;
  const maxFontSize = opts.fontSize || 116;
  const minFontSize = opts.minFontSize || 26;
  const lineHeightFactor = opts.lineHeightFactor || 1.05;
  const delay = opts.delay || 90;
  const cycles = opts.cycles || 3;
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

  const frames = palette.length * cycles;
  for (let i = 0; i < frames; i += 1) {
    const mainColor = palette[i % palette.length];

    drawBackground(ctx, width, height, bgColor ?? transparentColor);

    drawText(ctx, layout, {
      width,
      height,
      fontFamily,
      fontWeight,
      paddingX,
      paddingY,
      textColor: mainColor,
      strokeColor: null,
      strokeWidth: 0,
      scale: 1,
      align: 'center',
      valign: 'middle',
      glowColor: 'transparent',
      glowBlur: 0
    });

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return gifToAnimatedWebp(encoder.out.getData());
}
