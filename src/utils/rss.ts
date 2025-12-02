import Parser from "rss-parser";

const parser = new Parser();

export interface NewsItem {
  title: string;
  url: string;
  pubDate: string;
  source?: string;
}

export async function fetchGoogleNews(
  keyword: string,
  limit: number = 5
): Promise<NewsItem[]> {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=ja&gl=JP&ceid=JP:ja`;

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
