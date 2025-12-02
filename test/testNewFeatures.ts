import "dotenv/config";
import { getRandomTopics, buildOrQuery } from "../src/tools/topics.js";
import { fetchNews } from "../src/tools/fetchNews.js";
import { getMakotoPrompt, buildFormatPrompt, fetchArticleContent } from "../src/tools/formatNews.js";

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

  // 4. 記事内容取得
  console.log("\n4. 記事内容取得（最初の記事）");
  const articleContent = await fetchArticleContent(news[0].url);
  console.log("記事内容（先頭500文字）:");
  console.log(articleContent.slice(0, 500) + "...");

  // 5. まことちゃんプロンプト
  console.log("\n5. まことちゃんプロンプト確認");
  const makotoPrompt = await getMakotoPrompt();
  console.log("プロンプト長:", makotoPrompt.length, "文字");

  // 6. 整形プロンプト生成
  console.log("\n6. 整形プロンプト生成");
  const formatPrompt = buildFormatPrompt(makotoPrompt, news[0], articleContent);
  console.log("整形プロンプト（先頭300文字）:");
  console.log(formatPrompt.slice(0, 300) + "...");

  console.log("\n=== テスト完了 ===");
}

main().catch(console.error);
