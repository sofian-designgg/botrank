const { GuildConfig } = require("../models/GuildConfig");

async function getOrCreateGuildConfig(guildId) {
  let cfg = await GuildConfig.findOne({ guildId });
  if (!cfg) cfg = await GuildConfig.create({ guildId });
  return cfg;
}

module.exports = { getOrCreateGuildConfig };
