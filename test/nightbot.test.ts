import { postToNightbot } from "../src/tools/nightbot.ts";

async function test() {
  console.log("=== post_to_nightbot ツールのテスト ===\n");

  // テスト1: トークンなしでの実行（エラー確認）
  console.log("1. トークンなしでの実行");
  const result1 = await postToNightbot({ message: "テスト投稿" });
  console.log(`  success: ${result1.success}`);
  console.log(`  message: ${result1.message}`);
  console.log(`  期待値: NIGHTBOT_ACCESS_TOKEN is not set → ${result1.message.includes("NIGHTBOT_ACCESS_TOKEN") ? "✓" : "✗"}`);

  console.log("\n---\n");

  // テスト2: 400文字超過
  console.log("2. 400文字超過のメッセージ");
  const longMessage = "あ".repeat(401);
  // 一時的に環境変数を設定してテスト
  process.env.NIGHTBOT_ACCESS_TOKEN = "dummy_token";
  const result2 = await postToNightbot({ message: longMessage });
  console.log(`  success: ${result2.success}`);
  console.log(`  message: ${result2.message}`);
  console.log(`  期待値: 400文字制限エラー → ${result2.message.includes("400") ? "✓" : "✗"}`);
  delete process.env.NIGHTBOT_ACCESS_TOKEN;

  console.log("\n=== テスト完了 ===");
}

test();
