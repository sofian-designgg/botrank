const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { getOrCreateUserStats } = require("../services/userStats");
const { msToHours, formatHours } = require("../util/time");
const { getAchievedRank, getNextRank } = require("../util/ranks");
const { config } = require("../config");
const { generateRankCard } = require("../services/rankCardGenerator");

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

  try {
    const buffer = await generateRankCard({
      avatarUrl: message.author.displayAvatarURL({ extension: "png", size: 256 }),
      username: message.author.username,
      totalHours,
      achievedRank: achieved,
      nextRank: next,
      todayHours: today,
    });

    const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`Carte de progression de ${message.author.username}`)
      .setImage("attachment://rank.png")
      .addFields(
        { name: "⚡ Boost vocal", value: boostInfo, inline: false },
      )
      .setFooter({ text: "Le derank se fait uniquement via !derank (admin)." })
      .setTimestamp();

    await message.reply({ embeds: [embed], files: [attachment] });
  } catch (err) {
    console.warn("[!rank] Carte non générée, fallback embed:", err.message);
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setAuthor({ name: `Carte de progression de ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
      .addFields(
        { name: "🎖 Rank actuel", value: achieved ? `${achieved.hours}h` : "Aucun", inline: true },
        { name: "🎯 Prochain rank", value: next ? `${next.hours}h` : "MAX atteint", inline: true },
        { name: "⏱ Temps vocal total", value: `**${total}h**`, inline: true },
        { name: "📆 Temps vocal aujourd'hui", value: `**${today}h**`, inline: true },
        { name: "⚡ Boost vocal", value: boostInfo, inline: false },
      )
      .setFooter({ text: "Le derank se fait uniquement via !derank (admin)." })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
}

module.exports = { handleRankCommand };

