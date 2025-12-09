import Parser from "rss-parser";

const parser = new Parser();

export interface NewsItem {
  title: string;
  url: string;
  googleNewsUrl: string;
  pubDate: string;
  source?: string;
  description?: string;
}

export async function fetchGoogleNews(
  keyword: string,
  limit: number = 20
): Promise<NewsItem[]> {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=ja&gl=JP&ceid=JP:ja`;

  const feed = await parser.parseURL(url);
  const items: NewsItem[] = feed.items.slice(0, limit).map((item) => {
    const googleNewsUrl = item.link || "";
    const originalUrl = decodeGoogleNewsUrl(googleNewsUrl);
    // descriptionからHTMLタグを除去してテキストだけ取得
    const description = item.contentSnippet || item.content || extractDescriptionFromHtml(item.description || "");

    return {
      title: item.title || "",
      url: originalUrl || googleNewsUrl,
      googleNewsUrl,
      pubDate: item.pubDate || "",
      source: item.source?.title || extractSource(item.title || ""),
      description: description || undefined,
    };
  });

  return items;
}

/**
 * HTMLからテキストを抽出
 */
function extractDescriptionFromHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Google NewsのURLから元記事URLをデコードする
 * Google NewsのURLはBase64でエンコードされた元URLを含む
 */
function decodeGoogleNewsUrl(googleUrl: string): string | null {
  try {
    // URLからBase64部分を抽出
    // 形式: https://news.google.com/rss/articles/CBMi...
    const match = googleUrl.match(/articles\/([^?]+)/);
    if (!match) return null;

    const encoded = match[1];
    // Base64デコード（URL-safe Base64）
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");

    // デコードされたデータから実際のURLを抽出
    // プロトバッファ形式なので、http(s)://で始まる部分を探す
    const urlMatch = decoded.match(/https?:\/\/[^\s\x00-\x1f]+/);
    return urlMatch ? urlMatch[0] : null;
  } catch {
    return null;
  }
}

// タイトルからソースを抽出（Google Newsの形式: "タイトル - ソース名"）
function extractSource(title: string): string | undefined {
  const match = title.match(/ - ([^-]+)$/);
  return match ? match[1].trim() : undefined;
}
