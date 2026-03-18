const mongoose = require("mongoose");

const UserStatsSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },

    totalVoiceMs: { type: Number, default: 0 },

    // Pour la règle "1h / jour"
    dailyVoiceMs: { type: Number, default: 0 },
    dailyDateKey: { type: String, default: null }, // ex: "2026-03-18" (UTC)

    // Boost vocal nouveaux membres
    boostUsed: { type: Boolean, default: false },
    boostExpiresAt: { type: Date, default: null },

    // Session vocal active (si présent)
    voiceSession: {
      joinedAt: { type: Date, default: null },
      multiplier: { type: Number, default: 1 },
      channelId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

UserStatsSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const UserStats = mongoose.model("UserStats", UserStatsSchema);

module.exports = { UserStats };
