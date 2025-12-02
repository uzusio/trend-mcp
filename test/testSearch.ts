import "dotenv/config";

async function testSearch() {
  const title = "超加工食品は若年成人の糖尿病リスクを高める可能性がある";
  const source = "dm-net.co.jp";
  const searchQuery = `${title} ${source}`;

  console.log("検索クエリ:", searchQuery);

  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
  console.log("検索URL:", searchUrl);

  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  console.log("ステータス:", response.status);

  const html = await response.text();
  console.log("HTML長さ:", html.length);
  console.log("HTML先頭500文字:", html.slice(0, 500));

  // URL抽出を試す
  const urlMatches = html.match(/href="(https?:\/\/[^"]+)"/g);
  console.log("\n見つかったURL数:", urlMatches?.length || 0);
  if (urlMatches) {
    console.log("最初の5つ:");
    urlMatches.slice(0, 5).forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  }

  // result__urlクラスを探す
  const resultUrls = html.match(/class="result__url"[^>]*>([^<]+)</g);
  console.log("\nresult__url:", resultUrls?.slice(0, 3));
}

testSearch().catch(console.error);
