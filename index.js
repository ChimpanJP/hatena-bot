import { Client, GatewayIntentBits, Events } from "discord.js";
import cron from "node-cron";
import Parser from "rss-parser";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // ← !test を読むために必要
  ]
});

const parser = new Parser();

// はてなブックマーク総合 RSS
const RSS_URL = "https://b.hatena.ne.jp/hotentry.rss";

// はてなブックマークTOP10取得
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
  console.log(`ログイン成功：${client.user.tag}`);

  // 毎日18:00に実行（日本時間）
  cron.schedule("0 18 * * *", async () => {
    try {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);
      await channel.send("📚 **今日のはてなブックマーク総合ランキング TOP10**");

      const message = await fetchHatenaTop10();
      await channel.send(message);

    } catch (err) {
      console.error("投稿エラー:", err);
    }
  });

  console.log("毎日18時の投稿スケジュールをセットしました");
});


// =============================
// 🎮 テスト投稿 "!test"
// =============================
client.on(Events.MessageCreate, async (message) => {
  if (message.content === "!test") {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send("⏳ **最新のはてなブックマーク総合ランキングを取得中…**");

    const msg = await fetchHatenaTop10();
    await channel.send(msg);
  }
});

client.login(process.env.DISCORD_TOKEN);
