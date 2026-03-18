const { config } = require("./config");
const { GuildConfig } = require("./models/GuildConfig");
const { UserStats } = require("./models/UserStats");
const { dateKeyUtc, nextUtcMidnightMsFromNow, msToHours } = require("./util/time");

async function runDailyDerank(client, splitSessionsAtMidnight) {
  // split active voice sessions so daily totals are correct
  for (const [guildId] of client.guilds.cache) {
    await splitSessionsAtMidnight(guildId);
  }

  const todayKey = dateKeyUtc();

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

      const totalHours = msToHours(stats.totalVoiceMs);
      // En mode "derank manuel", on ne retire plus de rôles automatiquement.
      // On ne garde ici que le reset quotidien pour `!rank` (temps vocal du jour).
      void totalHours;

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

