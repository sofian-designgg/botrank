require("dotenv").config();

function mustGetEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim().length === 0) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

const config = {
  discordToken: mustGetEnv("DISCORD_TOKEN"),
  mongoUrl: mustGetEnv("MONGO_URL"),
  commandPrefix: "!",
  ranks: [
    { hours: 10, roleId: "1477766282299572254" },
    { hours: 30, roleId: "1477763567167082506" },
    { hours: 50, roleId: "1470854476859441242" },
    { hours: 200, roleId: "1483466590715510836" },
  ],
  daily: {
    minHoursPerDayToKeepRank: 1,
    exemptTotalHours: 1000,
  },
  boost: {
    multiplier: 1.5,
    maxDaysSinceJoin: 5,
    uses: 1,
  },
};

module.exports = { config };
