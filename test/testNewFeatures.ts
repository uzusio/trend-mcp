import "dotenv/config";
import { getRandomTopics, buildOrQuery } from "../src/tools/topics.js";
import { fetchNews } from "../src/tools/fetchNews.js";
import { getMakotoPrompt, buildFormatPrompt, fetchFirstValidArticle } from "../src/tools/formatNews.js";

async function main() {
  console.log("=== テスト: 新機能 ===\n");

  // 1. ランダムトピック選択
  console.log("1. ランダムトピック選択 (3件)");
  const randomTopics = await getRandomTopics(3);
  console.log("選択されたトピック:", randomTopics);

  // 2. OR検索クエリ生成
  console.log("\n2. OR検索クエリ生成");
  const orQuery = buildOrQuery(randomTopics);
  console.log("生成されたクエリ:", orQuery);

  // 3. OR検索でニュース取得
  console.log("\n3. OR検索でニュース取得");
  const news = await fetchNews({ keyword: orQuery, limit: 3 });
  console.log("取得したニュース:");
  news.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.title}`);
    console.log(`     URL: ${item.url}`);
    console.log(`     概要: ${item.description?.slice(0, 100) || "なし"}...`);
  });

  if (news.length === 0) {
    console.log("ニュースが取得できませんでした");
    return;
  }

  // 4. 記事内容取得（複数候補から有効なものを探す）
  console.log("\n4. 記事内容取得（複数候補から有効なものを探す）");
  const articleResult = await fetchFirstValidArticle(news, 5);
  console.log("取得結果:", articleResult.success ? "成功" : "フォールバック");
  console.log("選択された記事:", articleResult.news.title.slice(0, 50) + "...");
  console.log("記事内容（先頭300文字）:");
  console.log(articleResult.content.slice(0, 300) + "...");

  // 5. まことちゃんプロンプト
  console.log("\n5. まことちゃんプロンプト確認");
  const makotoPrompt = await getMakotoPrompt();
  console.log("プロンプト長:", makotoPrompt.length, "文字");

  // 6. 整形プロンプト生成
  console.log("\n6. 整形プロンプト生成");
  const formatPrompt = buildFormatPrompt(makotoPrompt, articleResult.news, articleResult.content);
  console.log("整形プロンプト（先頭300文字）:");
  console.log(formatPrompt.slice(0, 300) + "...");

  console.log("\n=== テスト完了 ===");
}

main().catch(console.error);
