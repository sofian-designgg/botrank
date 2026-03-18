const { UserStats } = require("../models/UserStats");
const { dateKeyUtc } = require("../util/time");

async function getOrCreateUserStats(guildId, userId) {
  let s = await UserStats.findOne({ guildId, userId });
  if (!s) {
    s = await UserStats.create({ guildId, userId, dailyDateKey: dateKeyUtc() });
  }
  return s;
}

async function ensureDailyKey(stats, keyNow = dateKeyUtc()) {
  if (!stats.dailyDateKey) {
    stats.dailyDateKey = keyNow;
    stats.dailyVoiceMs = 0;
    return;
  }
  if (stats.dailyDateKey !== keyNow) {
    stats.dailyDateKey = keyNow;
    stats.dailyVoiceMs = 0;
  }
}

module.exports = { getOrCreateUserStats, ensureDailyKey };
