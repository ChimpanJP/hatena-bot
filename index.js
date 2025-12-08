import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";
import Parser from "rss-parser";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const parser = new Parser();

// RSS URL
const RSS_URL = "https://b.hatena.ne.jp/hotentry.rss";

// はてなブックマーク TOP10
async function fetchHatenaTop10() {
  try {
    const feed = await parser.parseURL(RSS_URL);
    const items = feed.items.slice(0, 10);

    return items
      .map((item, i) => `**${i + 1}. ${item.title}**\n${item.link}`)
      .join("\n\n");

  } catch (err) {
    return `取得エラー：${err.message}`;
  }
}

client.once("ready", () => {

  // 毎日18:00（日本時間）に投稿
  cron.schedule("0 18 * * *", async () => {
    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);
      await channel.send("📚 **今日のはてなブックマーク総合ランキング TOP10**");

      const message = await fetchHatenaTop10();
      await channel.send(message);

    } catch (err) {
      console.error("投稿エラー:", err);
    }
  }, { timezone: "Asia/Tokyo" });

  console.log("毎日18時の投稿スケジュールをセットしました");
});


// =============================
// 🎮 "!test" で手動テスト
// =============================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!test") {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await channel.send("⏳ **最新のはてなブックマーク総合ランキングを取得中…**");

    const msg = await fetchHatenaTop10();
    await channel.send(msg);
  }
});

client.login(process.env.DISCORD_TOKEN);
