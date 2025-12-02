import "dotenv/config";
import { postToNightbot } from "../src/tools/nightbot.js";

async function main() {
  console.log("Testing postToNightbot...");

  const result = await postToNightbot({
    message: "【テスト】MCPサーバーからの投稿テストです"
  });

  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
