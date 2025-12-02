import { fetchGoogleNews, NewsItem } from "../utils/rss.js";

export interface FetchNewsArgs {
  keyword: string;
  limit?: number;
}

export async function fetchNews(args: FetchNewsArgs): Promise<NewsItem[]> {
  const { keyword, limit = 5 } = args;
  return fetchGoogleNews(keyword, limit);
}
