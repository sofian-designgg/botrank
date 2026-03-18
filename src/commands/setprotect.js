const { getOrCreateGuildConfig } = require("../services/guildConfig");
const { isAdmin } = require("../util/permissions");

function parseUserId(message) {
  const mentioned = message.mentions.users?.first?.();
  if (mentioned) return mentioned.id;
  const raw = message.content.split(/\s+/).slice(1).join(" ").trim();
  const m = raw.match(/^<@!?(\d+)>$/) || raw.match(/^(\d+)$/);
  return m ? m[1] : null;
}

async function handleSetProtect(message) {
  if (!isAdmin(message.member)) {
    await message.reply("Commande admin uniquement.");
    return;
  }
  const userId = parseUserId(message);
  if (!userId) {
    await message.reply("Utilise: `!setprotect @membre` (ou l'ID). Ça toggle (ajoute/retire).");
    return;
  }

  const cfg = await getOrCreateGuildConfig(message.guild.id);
  const idx = cfg.protectedUserIds.indexOf(userId);
  if (idx >= 0) cfg.protectedUserIds.splice(idx, 1);
  else cfg.protectedUserIds.push(userId);
  await cfg.save();

  const state = idx >= 0 ? "retiré de" : "ajouté à";
  await message.reply(`<@${userId}> est ${state} la liste protégée (anti-derank).`);
}

module.exports = { handleSetProtect };

