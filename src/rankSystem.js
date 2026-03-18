const { EmbedBuilder } = require("discord.js");
const { getOrCreateUserStats } = require("./services/userStats");
const { getOrCreateGuildConfig } = require("./services/guildConfig");
const { msToHours } = require("./util/time");
const { getRankRoleIds, getAchievedRank } = require("./util/ranks");

async function sendRankNotification({ guild, channelId, member, totalHours, isRankUp, nextRankHours = null }) {
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased?.()) return;

  if (!isRankUp) {
    const dmText =
      "# TU A ETE DERANK CAR TU EST PAS ASSEZ ACTIF 🏆\nTu peut toujours te rattraper en venant en vocal\ndiscord.gg/sayuri";
    await member.send({ content: dmText }).catch(() => {});
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
    .setDescription(`**${member}** ${isRankUp ? "a gagné un rank !" : "a été derank !"}`)
    .addFields(
      { name: "⏱ Temps vocal total", value: `**${totalHours.toFixed(2)}h**`, inline: true },
    )
    .setTimestamp();

  if (isRankUp) {
    embed.setTitle("⬆️ RANK UP !").setColor(0x00ff00);
    if (nextRankHours) {
      embed.addFields({ name: "🎯 Prochain rank", value: `${nextRankHours}h`, inline: true });
    }
  } else {
    embed.setTitle("⬇️ DERANK !").setColor(0xff0000);
  }

  await channel.send({ embeds: [embed] }).catch(() => {});
}

async function applyRankRoles(member, achievedRoleId) {
  const rankRoleIds = getRankRoleIds();
  const toRemove = rankRoleIds.filter((id) => member.roles.cache.has(id) && id !== achievedRoleId);
  if (toRemove.length) await member.roles.remove(toRemove).catch(() => {});
  if (achievedRoleId && !member.roles.cache.has(achievedRoleId)) {
    await member.roles.add(achievedRoleId).catch(() => {});
  }
}

async function removeAllRankRoles(member) {
  const rankRoleIds = getRankRoleIds();
  const toRemove = rankRoleIds.filter((id) => member.roles.cache.has(id));
  if (toRemove.length) await member.roles.remove(toRemove).catch(() => {});
}

async function checkAndApplyRank(member, { notify = true } = {}) {
  const stats = await getOrCreateUserStats(member.guild.id, member.id);
  const cfg = await getOrCreateGuildConfig(member.guild.id);

  const totalHours = msToHours(stats.totalVoiceMs);
  const achieved = getAchievedRank(totalHours);

  const beforeHad = getRankRoleIds().some((id) => member.roles.cache.has(id));

  await applyRankRoles(member, achieved?.roleId ?? null);

  const afterHad = getRankRoleIds().some((id) => member.roles.cache.has(id));

  if (notify && achieved && (!beforeHad || !member.roles.cache.has(achieved.roleId))) {
    // notif rankup
    await sendRankNotification({
      guild: member.guild,
      channelId: cfg.rankChannelId,
      member,
      totalHours,
      isRankUp: true,
      nextRankHours: getAchievedRank(totalHours)?.hours,
    });
  } else if (notify && !achieved && beforeHad && !afterHad) {
    // plus de rank
    await sendRankNotification({
      guild: member.guild,
      channelId: cfg.derankChannelId,
      member,
      totalHours,
      isRankUp: false,
    });
  }
}

async function derankIfNeeded(member, reason = "DERANK") {
  const cfg = await getOrCreateGuildConfig(member.guild.id);
  await removeAllRankRoles(member);
  await sendRankNotification({
    guild: member.guild,
    channelId: cfg.derankChannelId,
    member,
    totalHours: 0,
    isRankUp: false,
  });
}

module.exports = { checkAndApplyRank, derankIfNeeded, removeAllRankRoles };

