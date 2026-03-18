const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { config } = require("./config");
const { getOrCreateUserStats } = require("./services/userStats");
const { getOrCreateGuildConfig } = require("./services/guildConfig");
const { msToHours } = require("./util/time");
const { getRankRoleIds, getAchievedRank } = require("./util/ranks");
const { renderRankCard } = require("./image/renderRankCard");

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

async function sendRankImage({ guild, channelId, member, levelText, subtitle }) {
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased?.()) return;

  const png = await renderRankCard({
    templatePath: config.assets.rankupTemplatePath,
    avatarUrl: member.user.displayAvatarURL({ extension: "png", size: 256 }),
    username: member.user.username,
    levelText,
    subtitle,
  });

  const file = new AttachmentBuilder(png, { name: "rank.png" });
  const embed = new EmbedBuilder().setImage("attachment://rank.png");
  await channel.send({ content: `${member}`, embeds: [embed], files: [file] }).catch(() => {});
}

async function checkAndApplyRank(member, { notify = true } = {}) {
  const stats = await getOrCreateUserStats(member.guild.id, member.id);
  const cfg = await getOrCreateGuildConfig(member.guild.id);

  const totalHours = msToHours(stats.totalVoiceMs);
  const achieved = getAchievedRank(totalHours);

  // si déjà deranké manuellement (plus de roles), on rerank automatiquement dès qu'il dépasse un palier
  const beforeHad = getRankRoleIds().some((id) => member.roles.cache.has(id));

  await applyRankRoles(member, achieved?.roleId ?? null);

  const afterHad = getRankRoleIds().some((id) => member.roles.cache.has(id));

  if (notify && achieved && (!beforeHad || !member.roles.cache.has(achieved.roleId))) {
    // notif rankup
    await sendRankImage({
      guild: member.guild,
      channelId: cfg.rankChannelId,
      member,
      levelText: `LV ${achieved.hours}`,
      subtitle: "RANK UP",
    });
  } else if (notify && !achieved && beforeHad && !afterHad) {
    // plus de rank
    await sendRankImage({
      guild: member.guild,
      channelId: cfg.derankChannelId,
      member,
      levelText: "0",
      subtitle: "DERANK",
    });
  }
}

async function derankIfNeeded(member, reason = "DERANK") {
  const cfg = await getOrCreateGuildConfig(member.guild.id);
  await removeAllRankRoles(member);
  await sendRankImage({
    guild: member.guild,
    channelId: cfg.derankChannelId,
    member,
    levelText: "0",
    subtitle: reason,
  });
}

module.exports = { checkAndApplyRank, derankIfNeeded, removeAllRankRoles };

