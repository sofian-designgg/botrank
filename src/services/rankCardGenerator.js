const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");
const { RANK_CARD } = require("../config/rankCard");

// Enregistrer les polices (Arial n'existe pas sur Linux/Railway)
const fontBold = path.join(__dirname, "../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf");
const fontRegular = path.join(__dirname, "../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf");
if (fs.existsSync(fontBold)) GlobalFonts.registerFromPath(fontBold, "RankCardBold");
if (fs.existsSync(fontRegular)) GlobalFonts.registerFromPath(fontRegular, "RankCard");

/**
 * Génère une carte de niveau en image à partir du template.
 * @param {Object} options
 * @param {string} options.avatarUrl - URL de l'avatar Discord
 * @param {string} options.username - Pseudo du membre
 * @param {number} options.totalHours - Heures vocales totales
 * @param {Object} options.achievedRank - { hours, roleId } ou null
 * @param {Object} options.nextRank - { hours, roleId } ou null
 * @param {string} options.todayHours - Temps vocal du jour formaté
 * @returns {Promise<Buffer>} PNG buffer
 */
async function generateRankCard(options) {
  const {
    avatarUrl,
    username,
    totalHours,
    achievedRank,
    nextRank,
    todayHours,
  } = options;

  const { width, height, avatar, username: userCfg, stats, progressBar } = RANK_CARD;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Charger le template
  const templatePath = RANK_CARD.templatePath;
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template introuvable: ${templatePath}. Place ton image rank-card-template.png dans le dossier assets/`
    );
  }

  const template = await loadImage(templatePath);
  ctx.drawImage(template, 0, 0, width, height);

  // --- 1. Avatar (cercle) - centrage type "cover" ---
  try {
    const avatarImg = await loadImage(avatarUrl + "?size=256");
    const { centerX, centerY, radius } = avatar;

    const size = radius * 2;
    const imgW = avatarImg.width;
    const imgH = avatarImg.height;
    const scale = Math.max(size / imgW, size / imgH);
    const cropSize = size / scale;
    const srcX = (imgW - cropSize) / 2;
    const srcY = (imgH - cropSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      avatarImg,
      srcX, srcY, cropSize, cropSize,
      centerX - radius, centerY - radius, size, size
    );
    ctx.restore();
  } catch (e) {
    console.warn("[rankCard] Avatar non chargé:", e.message);
  }

  // --- 2. Pseudo (rouge) ---
  ctx.font = `${userCfg.fontSize}px RankCardBold`;
  ctx.fillStyle = "#E74C3C";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;

  const displayName = String(username).slice(0, 20);
  ctx.strokeText(displayName, userCfg.x, userCfg.y);
  ctx.fillText(displayName, userCfg.x, userCfg.y);

  // --- 3. Stats (rouge) ---
  ctx.font = `${stats.fontSize}px RankCard`;
  ctx.fillStyle = "#E74C3C";
  ctx.lineWidth = 2;

  const lines = [
    achievedRank ? `Rank: ${achievedRank.hours}h` : "Rank: —",
    nextRank ? `Prochain: ${nextRank.hours}h` : "Prochain: MAX",
    `Total: ${totalHours.toFixed(1)}h`,
    `Aujourd'hui: ${todayHours}`,
  ];

  let y = stats.y;
  for (const line of lines) {
    ctx.strokeText(line, stats.x, y);
    ctx.fillText(line, stats.x, y);
    y += stats.lineHeight;
  }

  // --- 4. Barre de progression ---
  const current = achievedRank ? achievedRank.hours : 0;
  const target = nextRank ? nextRank.hours : current || 10;
  const progress = target > current ? (totalHours - current) / (target - current) : 1;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  const { x: pbX, y: pbY, width: pbW, height: pbH, borderRadius, backgroundColor, fillColor } = progressBar;

  ctx.fillStyle = backgroundColor;
  roundRect(ctx, pbX, pbY, pbW, pbH, borderRadius);
  ctx.fill();

  ctx.fillStyle = fillColor;
  const fillW = pbW * clampedProgress;
  if (fillW > 0) {
    roundRect(ctx, pbX, pbY, fillW, pbH, borderRadius);
    ctx.fill();
  }

  return canvas.toBuffer("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

module.exports = { generateRankCard };
