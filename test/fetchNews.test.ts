import { fetchNews } from "../src/tools/fetchNews.ts";

async function test() {
  console.log("=== fetch_news ツールのテスト ===\n");

  // テスト1: カテゴリ指定（テクノロジー）
  console.log("1. カテゴリ: tech, limit: 3");
  try {
    const techNews = await fetchNews({ category: "tech", limit: 3 });
    console.log(`取得件数: ${techNews.length}`);
    techNews.forEach((item, i) => {
      console.log(`  [${i + 1}] ${item.title}`);
      console.log(`      URL: ${item.url}`);
      console.log(`      日時: ${item.pubDate}`);
    });
  } catch (error) {
    console.error("エラー:", error);
  }

  console.log("\n---\n");

  // テスト2: キーワード検索
  console.log("2. キーワード: ゲーム, limit: 3");
  try {
    const gameNews = await fetchNews({ category: "national", keyword: "ゲーム", limit: 3 });
    console.log(`取得件数: ${gameNews.length}`);
    gameNews.forEach((item, i) => {
      console.log(`  [${i + 1}] ${item.title}`);
    });
  } catch (error) {
    console.error("エラー:", error);
  }

  console.log("\n---\n");

  // テスト3: 各カテゴリの動作確認
  console.log("3. 全カテゴリの動作確認");
  const categories = ["national", "world", "business", "tech", "entertainment", "sports"] as const;
  for (const category of categories) {
    try {
      const news = await fetchNews({ category, limit: 1 });
      console.log(`  ${category}: ${news.length > 0 ? "✓" : "✗"} (${news[0]?.title?.slice(0, 30)}...)`);
    } catch (error) {
      console.log(`  ${category}: ✗ エラー`);
    }
  }

  console.log("\n=== テスト完了 ===");
}

test();
