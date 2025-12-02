import { fetchGoogleNews, NewsItem } from "../utils/rss.js";

export type NewsCategory = "national" | "world" | "business" | "tech" | "entertainment" | "sports";

export interface FetchNewsArgs {
  category: NewsCategory;
  keyword?: string;
  limit?: number;
}

export async function fetchNews(args: FetchNewsArgs): Promise<NewsItem[]> {
  const { category, keyword, limit = 5 } = args;
  return fetchGoogleNews(category, keyword, limit);
}
