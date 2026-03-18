const { getOrCreateUserStats } = require("../services/userStats");
const { msToHours, formatHours } = require("../util/time");
const { getAchievedRank, getNextRank } = require("../util/ranks");
const { config } = require("../config");

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

  await message.reply(
    [
      `${message.author}`,
      `- ${currentInfo}`,
      `- ${nextInfo}`,
      `- Temps vocal total: **${total}h**`,
      `- Temps vocal aujourd'hui: **${today}h**`,
      `- ${boostInfo}`,
    ].join("\n")
  );
}

module.exports = { handleRankCommand };

