const { nextUtcMidnightMsFromNow } = require("./util/time");

/**
 * À minuit UTC : on split les sessions vocales actives pour créditer correctement
 * le temps (éviter de perdre du temps pour ceux en vocal à minuit).
 * On ne réinitialise plus dailyVoiceMs/dailyDateKey — le temps vocal reste cumulé.
 */
async function runDailyTick(client, splitSessionsAtMidnight) {
  for (const [guildId] of client.guilds.cache) {
    await splitSessionsAtMidnight(guildId);
  }
}

function startScheduler(client, splitSessionsAtMidnight) {
  async function tick() {
    await runDailyTick(client, splitSessionsAtMidnight);
  }

  const delay = nextUtcMidnightMsFromNow(new Date());
  setTimeout(() => {
    tick().catch(() => {});
    setInterval(() => tick().catch(() => {}), 24 * 60 * 60 * 1000);
  }, delay);
}

module.exports = { startScheduler, runDailyTick };

