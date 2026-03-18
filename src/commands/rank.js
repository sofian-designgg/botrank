const { EmbedBuilder } = require("discord.js");
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
      ? `Actif (x${config.boost.multiplier})`
      : `Disponible une seule fois (nouveau ≤ ${config.boost.maxDaysSinceJoin} jours)`;

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setAuthor({ name: `Carte de progression de ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
    .addFields(
      {
        name: "🎖 Rank actuel",
        value: achieved ? `${achieved.hours}h` : "Aucun",
        inline: true,
      },
      {
        name: "🎯 Prochain rank",
        value: next ? `${next.hours}h` : "MAX atteint",
        inline: true,
      },
      {
        name: "⏱ Temps vocal total",
        value: `**${total}h**`, 
        inline: true,
      },
      {
        name: "📆 Temps vocal aujourd'hui",
        value: `**${today}h**`, 
        inline: true,
      },
      {
        name: "⚡ Boost vocal",
        value: boostInfo,
        inline: false,
      },
    )
    .setFooter({ text: "Reste actif en vocal pour ne pas être derank." })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

module.exports = { handleRankCommand };

