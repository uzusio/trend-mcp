import { getTrendTopics, setTrendTopics } from "../src/tools/topics.ts";

async function test() {
  console.log("=== トピック管理ツールのテスト ===\n");

  // テスト1: トピック取得
  console.log("1. トピック一覧取得");
  try {
    const topics = await getTrendTopics();
    console.log(`取得件数: ${topics.length}`);
    console.log("トピック:");
    topics.forEach((topic, i) => {
      console.log(`  [${i + 1}] ${topic}`);
    });
  } catch (error) {
    console.error("エラー:", error);
  }

  console.log("\n=== テスト完了 ===");
}

test();
