const { getOrCreateGuildConfig } = require("../services/guildConfig");
const { isAdmin } = require("../util/permissions");

function parseChannelId(message) {
  const mentioned = message.mentions.channels?.first?.();
  if (mentioned) return mentioned.id;
  const raw = message.content.split(/\s+/).slice(1).join(" ").trim();
  const m = raw.match(/^<#(\d+)>$/) || raw.match(/^(\d+)$/);
  return m ? m[1] : null;
}

async function handleSetChannelRank(message) {
  if (!isAdmin(message.member)) {
    await message.reply("Commande admin uniquement.");
    return;
  }
  const channelId = parseChannelId(message);
  if (!channelId) {
    await message.reply("Utilise: `!setchannelrank #salon` (ou l'ID du salon).");
    return;
  }
  const cfg = await getOrCreateGuildConfig(message.guild.id);
  cfg.rankChannelId = channelId;
  await cfg.save();
  await message.reply(`Salon de rank défini: <#${channelId}>`);
}

async function handleSetChannelDerank(message) {
  if (!isAdmin(message.member)) {
    await message.reply("Commande admin uniquement.");
    return;
  }
  const channelId = parseChannelId(message);
  if (!channelId) {
    await message.reply("Utilise: `!setchannelderank #salon` (ou l'ID du salon).");
    return;
  }
  const cfg = await getOrCreateGuildConfig(message.guild.id);
  cfg.derankChannelId = channelId;
  await cfg.save();
  await message.reply(`Salon de derank défini: <#${channelId}>`);
}

module.exports = { handleSetChannelRank, handleSetChannelDerank };

