const { config } = require("./config");
const { getOrCreateUserStats, ensureDailyKey } = require("./services/userStats");
const { dateKeyUtc } = require("./util/time");
const dayjs = require("dayjs");

function isRealVoiceJoin(oldState, newState) {
  return !oldState.channelId && newState.channelId;
}
function isRealVoiceLeave(oldState, newState) {
  return oldState.channelId && !newState.channelId;
}
function isVoiceMove(oldState, newState) {
  return oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;
}

async function startSession(guildId, userId, channelId, multiplier) {
  const stats = await getOrCreateUserStats(guildId, userId);
  await ensureDailyKey(stats, dateKeyUtc());

  // Check if boost has expired
  const isBoostActive = stats.boostUsed && stats.boostExpiresAt && dayjs(stats.boostExpiresAt).isAfter(dayjs());
  const effectiveMultiplier = isBoostActive ? config.boost.multiplier : 1;

  stats.voiceSession = {
    joinedAt: new Date(),
    multiplier: effectiveMultiplier,
    channelId,
  };
  await stats.save();
}

async function endSession(guildId, userId) {
  const stats = await getOrCreateUserStats(guildId, userId);
  await ensureDailyKey(stats, dateKeyUtc());

  const joinedAt = stats.voiceSession?.joinedAt ? new Date(stats.voiceSession.joinedAt) : null;
  const multiplier = stats.voiceSession?.multiplier ?? 1;
  if (!joinedAt) return { addedMs: 0 };

  const now = new Date();
  const delta = Math.max(0, now.getTime() - joinedAt.getTime());
  const gained = Math.floor(delta * multiplier);

  stats.totalVoiceMs += gained;
  stats.dailyVoiceMs += gained;
  stats.voiceSession = { joinedAt: null, multiplier: 1, channelId: null };

  // If boost has expired, reset it
  if (stats.boostUsed && stats.boostExpiresAt && dayjs(stats.boostExpiresAt).isBefore(dayjs())) {
    stats.boostUsed = false;
    stats.boostExpiresAt = null;
  }

  await stats.save();

  return { addedMs: gained };
}

async function splitSessionsAtMidnight(guildId) {
  const keyNow = dateKeyUtc();
  const statsList = await require("./models/UserStats").UserStats.find({
    guildId,
    "voiceSession.joinedAt": { $ne: null },
  });

  for (const stats of statsList) {
    const joinedAt = stats.voiceSession?.joinedAt ? new Date(stats.voiceSession.joinedAt) : null;
    if (!joinedAt) continue;

    const now = new Date();
    const delta = Math.max(0, now.getTime() - joinedAt.getTime());
    const multiplier = stats.voiceSession?.multiplier ?? 1;
    const gained = Math.floor(delta * multiplier);

    stats.totalVoiceMs += gained;
    stats.dailyVoiceMs += gained;

    await ensureDailyKey(stats, keyNow);

    stats.voiceSession.joinedAt = now;
    await stats.save();
  }
}

async function reconcileOnReady(client) {
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const members = await guild.members.fetch();
      for (const [, member] of members) {
        const vs = member.voice;
        if (vs?.channelId) {
          const stats = await getOrCreateUserStats(guildId, member.id);
          const hasSession = !!stats.voiceSession?.joinedAt;
          if (!hasSession) {
            const isBoostActive = stats.boostUsed && stats.boostExpiresAt && dayjs(stats.boostExpiresAt).isAfter(dayjs());
            const multiplier = isBoostActive ? config.boost.multiplier : 1;
            await startSession(guildId, member.id, vs.channelId, multiplier);
          }
        }
      }
    } catch {
      // ignore guild fetch issues
    }
  }
}

function wireVoiceTracker(client, onVoiceTimeAdded) {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    const guildId = newState.guild?.id ?? oldState.guild?.id;
    const userId = newState.id ?? oldState.id;
    if (!guildId || !userId) return;

    const member = newState.member ?? oldState.member;
    if (member?.user?.bot) return;

    // Get stats to check boost status before starting/ending session
    const stats = await getOrCreateUserStats(guildId, userId);
    const isBoostActive = stats.boostUsed && stats.boostExpiresAt && dayjs(stats.boostExpiresAt).isAfter(dayjs());
    const multiplier = isBoostActive ? config.boost.multiplier : 1;

    if (isRealVoiceJoin(oldState, newState)) {
      await startSession(guildId, userId, newState.channelId, multiplier);
      return;
    }

    if (isVoiceMove(oldState, newState)) {
      await endSession(guildId, userId);
      await startSession(guildId, userId, newState.channelId, multiplier);
      return;
    }

    if (isRealVoiceLeave(oldState, newState)) {
      const { addedMs } = await endSession(guildId, userId);
      if (addedMs > 0 && typeof onVoiceTimeAdded === "function") {
        await onVoiceTimeAdded({ guildId, userId, addedMs });
      }
    }
  });

  return { reconcileOnReady, splitSessionsAtMidnight };
}

module.exports = { wireVoiceTracker, startSession, endSession };
