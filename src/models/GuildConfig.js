const mongoose = require("mongoose");

const GuildConfigSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    rankChannelId: { type: String, default: null },
    derankChannelId: { type: String, default: null },
    protectedUserIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

const GuildConfig = mongoose.model("GuildConfig", GuildConfigSchema);

module.exports = { GuildConfig };
