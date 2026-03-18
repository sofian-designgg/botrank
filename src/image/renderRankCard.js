const path = require("path");
const { Canvas, loadImage } = require("@napi-rs/canvas");

// Coords basés sur ton template (généré en paysage). Ajuste si tu changes d'image.
function defaultLayout(w, h) {
  return {
    avatar: { x: Math.round(w * 0.0586), y: Math.round(h * 0.295), s: Math.round(h * 0.399) },
    nameBox: {
      x: Math.round(w * 0.264),
      y: Math.round(h * 0.069),
      w: Math.round(w * 0.508),
      h: Math.round(h * 0.156),
    },
    level: { cx: Math.round(w * 0.596), cy: Math.round(h * 0.503) },
    ribbon: {
      x: Math.round(w * 0.371),
      y: Math.round(h * 0.79),
      w: Math.round(w * 0.273),
      h: Math.round(h * 0.13),
    },
  };
}

function drawFittedText(ctx, text, x, y, maxWidth, baseFontPx, fontFamily, color) {
  let size = baseFontPx;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 20; i++) {
    ctx.font = `bold ${Math.max(10, Math.floor(size))}px ${fontFamily}`;
    const m = ctx.measureText(text);
    if (m.width <= maxWidth) break;
    size *= 0.92;
  }
  ctx.fillText(text, x, y);
}

async function renderRankCard({ templatePath, avatarUrl, username, levelText, subtitle }) {
  const tpl = await loadImage(path.resolve(templatePath));
  const w = tpl.width;
  const h = tpl.height;

  const canvas = new Canvas(w, h);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(tpl, 0, 0, w, h);

  const layout = defaultLayout(w, h);

  if (avatarUrl) {
    try {
      const av = await loadImage(avatarUrl);
      ctx.drawImage(av, layout.avatar.x, layout.avatar.y, layout.avatar.s, layout.avatar.s);
    } catch {
      // ignore avatar failures
    }
  }

  const gold1 = "#F7E7B2";
  const gold2 = "#FFD36A";
  const fontFamily = "serif";

  drawFittedText(
    ctx,
    username,
    layout.nameBox.x + layout.nameBox.w / 2,
    layout.nameBox.y + layout.nameBox.h / 2,
    layout.nameBox.w * 0.92,
    h * 0.11,
    fontFamily,
    gold1
  );

  drawFittedText(ctx, String(levelText), layout.level.cx, layout.level.cy, w * 0.22, h * 0.22, fontFamily, gold2);

  if (subtitle) {
    drawFittedText(
      ctx,
      subtitle,
      layout.ribbon.x + layout.ribbon.w / 2,
      layout.ribbon.y + layout.ribbon.h / 2,
      layout.ribbon.w * 0.95,
      h * 0.08,
      fontFamily,
      gold1
    );
  }

  return canvas.toBuffer("image/png");
}

module.exports = { renderRankCard };
