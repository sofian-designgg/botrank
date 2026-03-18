const { EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../util/permissions");
const { getRankRoleIds } = require("../util/ranks");
const { getOrCreateGuildConfig } = require("../services/guildConfig");

function parseUserId(message) {
  const u = message.mentions.users.first();
  if (u) return u.id;
  const m = message.content.match(/<@!?(\d+)>/);
  return m ? m[1] : null;
}

function parseRoleId(message) {
  const r = message.mentions.roles.first();
  if (r) return r.id;
  // Discord role ids are snowflakes: 17-19 digits
  const m = message.content.match(/\b(\d{17,19})\b/);
  return m ? m[1] : null;
}

async function handleDerankCommand(message) {
  if (!isAdmin(message.member)) {
    await message.reply("Commande admin uniquement.");
    return;
  }

  const userId = parseUserId(message);
  const roleId = parseRoleId(message);

  if (!userId || !roleId) {
    await message.reply("Utilise: `!derank @membre @role` (choisis le role rank à enlever).");
    return;
  }

  const rankRoleIds = getRankRoleIds();
  if (!rankRoleIds.includes(roleId)) {
    await message.reply("Le rôle choisi n'est pas un rôle de rank.");
    return;
  }

  const member = await message.guild.members.fetch(userId).catch(() => null);
  if (!member) {
    await message.reply("Je n'ai pas trouvé ce membre.");
    return;
  }

  await member.roles.remove(roleId).catch(() => {});

  const cfg = await getOrCreateGuildConfig(message.guild.id);
  const configuredChannel = cfg.derankChannelId ? message.guild.channels.cache.get(cfg.derankChannelId) : null;
  const channel = configuredChannel?.isTextBased?.() ? configuredChannel : message.channel;

  const description =
    "# TU A ETE DERANK CAR TU EST PAS ASSEZ ACTIF 🏆\nTu peut toujours te rattraper en venant en vocal\ndiscord.gg/sayuri";

  const embed = new EmbedBuilder()
    .setColor(0xff6b00)
    .setDescription(description)
    .setTimestamp();

  await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
}

module.exports = { handleDerankCommand };

