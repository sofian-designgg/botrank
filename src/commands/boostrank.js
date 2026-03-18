const { config } = require("../config");
const { getOrCreateUserStats } = require("../services/userStats");

async function handleBoostRankCommand(message) {
  const member = message.member;
  if (!member) return;

  const joinedAt = member.joinedAt ? new Date(member.joinedAt) : null;
  if (!joinedAt) {
    await message.reply("Je ne peux pas vérifier ta date d'arrivée sur le serveur.");
    return;
  }

  const msSinceJoin = Date.now() - joinedAt.getTime();
  const maxMs = config.boost.maxDaysSinceJoin * 24 * 60 * 60 * 1000;

  if (msSinceJoin > maxMs) {
    await message.reply(`Tu n'es plus éligible au boost (limite: ${config.boost.maxDaysSinceJoin} jours).`);
    return;
  }

  const stats = await getOrCreateUserStats(message.guild.id, message.author.id);

  if (stats.boostUsed >= config.boost.uses) {
    await message.reply("Tu as déjà utilisé ton boost.");
    return;
  }

  stats.boostUsed = config.boost.uses;
  await stats.save();

  await message.reply(`Boost activé: ton temps vocal compte maintenant en **x${config.boost.multiplier}**.`);
}

module.exports = { handleBoostRankCommand };

