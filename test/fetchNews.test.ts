import { fetchNews } from "../src/tools/fetchNews.ts";
import { getTrendTopics } from "../src/tools/topics.ts";

async function test() {
  console.log("=== fetch_news ツールのテスト ===\n");

  // テスト1: キーワード検索
  console.log("1. キーワード: VALORANT, limit: 3");
  try {
    const news = await fetchNews({ keyword: "VALORANT", limit: 3 });
    console.log(`取得件数: ${news.length}`);
    news.forEach((item, i) => {
      console.log(`  [${i + 1}] ${item.title}`);
    });
  } catch (error) {
    console.error("エラー:", error);
  }

  console.log("\n---\n");

  // テスト2: トピック一覧からいくつか検索
  console.log("2. トピック一覧から検索テスト");
  try {
    const topics = await getTrendTopics();
    const testTopics = topics.slice(0, 5); // 最初の5件をテスト

    for (const topic of testTopics) {
      const news = await fetchNews({ keyword: topic, limit: 1 });
      const result = news.length > 0 ? `✓ ${news[0].title.slice(0, 40)}...` : "✗ 結果なし";
      console.log(`  ${topic}: ${result}`);
    }
  } catch (error) {
    console.error("エラー:", error);
  }

  console.log("\n=== テスト完了 ===");
}

test();
