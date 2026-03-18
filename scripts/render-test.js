const fs = require("fs");
const path = require("path");
const { renderRankCard } = require("../src/image/renderRankCard");

async function run() {
  const outPath = path.join(__dirname, "rank_test_output.png");
  const buf = await renderRankCard({
    templatePath: path.join(__dirname, "..", "Generated_image.png"),
    avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
    username: "Sayu",
    levelText: "LV 0",
    subtitle: "PROGRESSION",
  });
  fs.writeFileSync(outPath, buf);
  // eslint-disable-next-line no-console
  console.log("Wrote:", outPath);
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

