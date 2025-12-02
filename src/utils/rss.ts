import Parser from "rss-parser";

const parser = new Parser();

export interface NewsItem {
  title: string;
  url: string;
  pubDate: string;
  source?: string;
}

// Google News RSSのカテゴリマッピング（日本版）
const CATEGORY_MAP: Record<string, string> = {
  national: "NATION",
  world: "WORLD",
  business: "BUSINESS",
  tech: "TECHNOLOGY",
  entertainment: "ENTERTAINMENT",
  sports: "SPORTS",
};

export async function fetchGoogleNews(
  category: string,
  keyword?: string,
  limit: number = 5
): Promise<NewsItem[]> {
  let url: string;

  if (keyword) {
    // キーワード検索
    const encodedKeyword = encodeURIComponent(keyword);
    url = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=ja&gl=JP&ceid=JP:ja`;
  } else {
    // カテゴリ検索
    const googleCategory = CATEGORY_MAP[category] || "NATION";
    url = `https://news.google.com/rss/headlines/section/topic/${googleCategory}?hl=ja&gl=JP&ceid=JP:ja`;
  }

  const feed = await parser.parseURL(url);
  const items: NewsItem[] = feed.items.slice(0, limit).map((item) => ({
    title: item.title || "",
    url: item.link || "",
    pubDate: item.pubDate || "",
    source: item.source?.title || extractSource(item.title || ""),
  }));

  return items;
}

// タイトルからソースを抽出（Google Newsの形式: "タイトル - ソース名"）
function extractSource(title: string): string | undefined {
  const match = title.match(/ - ([^-]+)$/);
  return match ? match[1].trim() : undefined;
}
