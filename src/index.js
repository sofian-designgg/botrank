const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { config } = require("./config");
const { connectMongo } = require("./db");
const { wireVoiceTracker } = require("./voiceTracker");
const { checkAndApplyRank } = require("./rankSystem");
const { startScheduler } = require("./scheduler");

const { handleRankCommand } = require("./commands/rank");
const { handleBoostRankCommand } = require("./commands/boostrank");
const { handleSetProtect } = require("./commands/setprotect");
const { handleSetChannelRank, handleSetChannelDerank } = require("./commands/setchannel");

async function main() {
  await connectMongo(config.mongoUrl);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
  });

  const { reconcileOnReady, splitSessionsAtMidnight } = wireVoiceTracker(client, async ({ guildId, userId }) => {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    await checkAndApplyRank(member, { notify: true });
  });

  client.on("ready", async () => {
    await reconcileOnReady(client);
    startScheduler(client, splitSessionsAtMidnight);
    // eslint-disable-next-line no-console
    console.log(`Logged in as ${client.user.tag}`);
  });

  client.on("messageCreate", async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!message.content.startsWith(config.commandPrefix)) return;

    const cmd = message.content.slice(config.commandPrefix.length).trim().split(/\s+/)[0]?.toLowerCase();

    try {
      if (cmd === "rank") return await handleRankCommand(message);
      if (cmd === "boostrank") return await handleBoostRankCommand(message);
      if (cmd === "setprotect") return await handleSetProtect(message);
      if (cmd === "setchannelrank") return await handleSetChannelRank(message);
      if (cmd === "setchannelderank") return await handleSetChannelDerank(message);
    } catch (e) {
      await message.reply("Erreur interne. Vérifie les logs du bot.");
    }
  });

  await client.login(config.discordToken);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

