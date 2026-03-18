const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { config } = require("../config");
const { getOrCreateUserStats } = require("../services/userStats");
const dayjs = require("dayjs");

async function handleBoostRankCommand(message) {
  const member = message.member;
  if (!member) return;

  const stats = await getOrCreateUserStats(member.guild.id, member.id);

  if (stats.boostUsed) {
    await message.reply({
      content: "Tu as déjà utilisé ton boost ou ton boost est déjà actif !",
      ephemeral: true,
    });
    return;
  }

  const joinedAt = member.joinedAt ? dayjs(member.joinedAt) : null;
  if (!joinedAt || dayjs().diff(joinedAt, "day") > config.boost.maxDaysSinceJoin) {
    await message.reply({
      content: `Tu n'es plus éligible au boost (limite : ${config.boost.maxDaysSinceJoin} jours après avoir rejoint le serveur).`,
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x00b0f0) // Couleur bleue pour le boost
    .setTitle("⚡ Boost de Rank disponible !")
    .setDescription(
      `Clique sur le bouton ci-dessous pour activer ton boost de rank. Ton temps vocal comptera en **x${config.boost.multiplier}** pendant **${config.boost.durationHours} heures**.`
    )
    .setFooter({ text: `Utilisable une seule fois | Expire ${config.boost.maxDaysSinceJoin} jours après avoir rejoint.` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("activate_boost")
      .setLabel("Activer mon Boost !")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🚀")
  );

  await message.reply({ embeds: [embed], components: [row] });
}

async function handleBoostButton(interaction) {
  const member = interaction.member;
  const stats = await getOrCreateUserStats(member.guild.id, member.id);

  if (stats.boostUsed) {
    await interaction.reply({
      content: "Tu as déjà activé ton boost ou ton boost est déjà actif !",
      ephemeral: true,
    });
    return;
  }

  stats.boostUsed = true;
  stats.boostExpiresAt = dayjs().add(config.boost.durationHours, "hour").toDate();
  await stats.save();

  // Démarrer une session boostée si le membre est déjà en vocal
  const vs = member.voice;
  if (vs?.channelId) {
    await require("../voiceTracker").startSession(member.guild.id, member.id, vs.channelId, config.boost.multiplier);
  }

  await interaction.reply({
    content: `🚀 Ton boost de rank en **x${config.boost.multiplier}** est activé pour **${config.boost.durationHours} heures** !`, 
    ephemeral: true,
  });
}

module.exports = { handleBoostRankCommand, handleBoostButton };

