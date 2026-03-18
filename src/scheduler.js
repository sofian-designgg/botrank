const { config } = require("./config");
const { GuildConfig } = require("./models/GuildConfig");
const { UserStats } = require("./models/UserStats");
const { dateKeyUtc, nextUtcMidnightMsFromNow, msToHours } = require("./util/time");
const { derankIfNeeded } = require("./rankSystem");

async function runDailyDerank(client, splitSessionsAtMidnight) {
  // split active voice sessions so daily totals are correct
  for (const [guildId] of client.guilds.cache) {
    await splitSessionsAtMidnight(guildId);
  }

  const todayKey = dateKeyUtc();
  const minMs = config.daily.minHoursPerDayToKeepRank * 60 * 60 * 1000;
  const exemptHours = config.daily.exemptTotalHours;

  const guildConfigs = await GuildConfig.find({});

  for (const cfg of guildConfigs) {
    const guild = client.guilds.cache.get(cfg.guildId);
    if (!guild) continue;

    let members;
    try {
      members = await guild.members.fetch();
    } catch {
      continue;
    }

    const statsList = await UserStats.find({ guildId: cfg.guildId });
    const statsByUser = new Map(statsList.map((s) => [s.userId, s]));

    for (const [, member] of members) {
      if (member.user.bot) continue;

      const stats = statsByUser.get(member.id);
      if (!stats) continue;

      const isProtected = cfg.protectedUserIds.includes(member.id);
      const totalHours = msToHours(stats.totalVoiceMs);
      const exempt = totalHours >= exemptHours;

      // Si sa dailyDateKey n'est pas aujourd'hui, on considère qu'il n'a rien fait "hier"
      // (car on reset le dailyVoiceMs au changement de date).
      // À minuit, ensureDailyKey sera déjà passée dans splitSessionsAtMidnight.
      const didEnoughToday = stats.dailyDateKey === todayKey && stats.dailyVoiceMs >= minMs;

      // Règle demandée: s'il ne fait pas au moins 1h vocal chaque jour -> derank à 00h
      if (!isProtected && !exempt && !didEnoughToday) {
        await derankIfNeeded(member, "DERANK");
      }

      // reset daily pour nouveau jour (on force, même si déjà ok)
      stats.dailyDateKey = todayKey;
      stats.dailyVoiceMs = 0;
      await stats.save();
    }
  }
}

function startScheduler(client, splitSessionsAtMidnight) {
  async function tick() {
    await runDailyDerank(client, splitSessionsAtMidnight);
  }

  const delay = nextUtcMidnightMsFromNow(new Date());
  setTimeout(() => {
    tick().catch(() => {});
    setInterval(() => tick().catch(() => {}), 24 * 60 * 60 * 1000);
  }, delay);
}

module.exports = { startScheduler, runDailyDerank };

