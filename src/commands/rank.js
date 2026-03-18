const { getOrCreateUserStats } = require("../services/userStats");
const { msToHours, formatHours } = require("../util/time");
const { getAchievedRank, getNextRank } = require("../util/ranks");
const { config } = require("../config");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { renderRankCard } = require("../image/renderRankCard");

async function handleRankCommand(message) {
  const stats = await getOrCreateUserStats(message.guild.id, message.author.id);

  const totalHours = msToHours(stats.totalVoiceMs);
  const achieved = getAchievedRank(totalHours);
  const next = getNextRank(totalHours);

  const today = formatHours(stats.dailyVoiceMs, 2);
  const total = formatHours(stats.totalVoiceMs, 2);

  const boostInfo =
    stats.boostUsed > 0
      ? `Boost: **actif** (x${config.boost.multiplier})`
      : `Boost: **disponible** (si nouveau membre ≤ ${config.boost.maxDaysSinceJoin} jours)`;

  const nextInfo = next ? `Prochain rank: **${next.hours}h**` : `Prochain rank: **MAX**`;
  const currentInfo = achieved ? `Rank actuel: **${achieved.hours}h**` : `Rank actuel: **aucun**`;

  const lines = [
    `- ${currentInfo}`,
    `- ${nextInfo}`,
    `- Temps vocal total: **${total}h**`,
    `- Temps vocal aujourd'hui: **${today}h**`,
    `- ${boostInfo}`,
  ];

  // Image de progression affichée directement avec !rank
  const levelText = achieved ? `LV ${achieved.hours}` : "LV 0";
  const subtitle = "PROGRESSION";
  const png = await renderRankCard({
    templatePath: config.assets.rankupTemplatePath,
    avatarUrl: message.author.displayAvatarURL({ extension: "png", size: 256 }),
    username: message.author.username,
    levelText,
    subtitle,
  });

  const file = new AttachmentBuilder(png, { name: "rank.png" });
  const embed = new EmbedBuilder().setImage("attachment://rank.png");

  await message.reply({ content: `Voici ta carte de rank, ${message.author} :`, embeds: [embed], files: [file] });
}

module.exports = { handleRankCommand };

