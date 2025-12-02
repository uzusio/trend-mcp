import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { NewsItem } from "../utils/rss.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_FILE = join(__dirname, "../../config/makoto-prompt.txt");

export interface FormatNewsArgs {
  news: NewsItem;
  articleContent: string;
}

export interface FormattedNews {
  original: NewsItem;
  formatted: string;
}

export interface ArticleFetchResult {
  success: boolean;
  content: string;
  news: NewsItem;
}

/**
 * まことちゃんのプロンプトを読み込む
 */
export async function getMakotoPrompt(): Promise<string> {
  return readFile(PROMPT_FILE, "utf-8");
}

/**
 * ニュース記事をまことちゃんのコメント形式に整形するためのプロンプトを生成
 */
export function buildFormatPrompt(makotoPrompt: string, news: NewsItem, articleContent?: string): string {
  // 記事内容がない場合はdescriptionを使用
  const content = articleContent && !articleContent.startsWith("記事の")
    ? articleContent
    : news.description || "（記事の詳細は取得できませんでした）";

  return `${makotoPrompt}

---

### タスク
以下のニュース記事を読んで、配信のコメント欄に流す雑談のネタとして要約してください。

### 出力フォーマット
【雑談のネタを提供するまことちゃん】「セリフとして記事の要約」

### 注意事項
- 400文字以内に収めてください（Nightbotの制限）
- まことちゃんの口調で、元気いっぱいに要約してね
- 記事の要点を簡潔に伝えつつ、視聴者が興味を持てるような言い方で
- URLは含めないで

### ニュース情報
タイトル: ${news.title}
ソース: ${news.source || "不明"}
公開日: ${news.pubDate}

### 記事の内容・概要
${content}
`;
}

/**
 * 記事URLから内容を取得する
 * Google Newsのリダイレクトに対応
 */
export async function fetchArticleContent(url: string): Promise<string> {
  try {
    // Google Newsのリダイレクトを追跡
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return `記事の取得に失敗しました (${response.status})`;
    }

    const finalUrl = response.url;
    const html = await response.text();

    // HTMLからテキストを簡易抽出
    const textContent = extractTextFromHtml(html);

    // 内容が少なすぎる場合（リダイレクトページなど）
    if (textContent.length < 100) {
      return `記事の内容を取得できませんでした。リダイレクト先: ${finalUrl}`;
    }

    // 最初の2000文字に制限
    return textContent.slice(0, 2000);
  } catch (error) {
    return `記事の取得エラー: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * HTMLからテキストを簡易抽出
 */
function extractTextFromHtml(html: string): string {
  // scriptとstyleタグを除去
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // HTMLタグを除去
  text = text.replace(/<[^>]+>/g, " ");
  // 連続する空白を1つに
  text = text.replace(/\s+/g, " ");
  // HTMLエンティティをデコード
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');

  return text.trim();
}

/**
 * 記事内容の取得が成功したかどうかを判定
 */
export function isValidArticleContent(content: string): boolean {
  // エラーメッセージで始まる場合は失敗
  if (content.startsWith("記事の取得") || content.startsWith("記事の内容")) {
    return false;
  }
  // 内容が短すぎる場合も失敗
  if (content.length < 100) {
    return false;
  }
  return true;
}

/**
 * ニュース一覧から記事本文を取得できるものを探す
 * 最初に成功したものを返す
 */
export async function fetchFirstValidArticle(
  newsList: NewsItem[],
  maxAttempts: number = 5
): Promise<ArticleFetchResult> {
  const attempts = Math.min(maxAttempts, newsList.length);

  for (let i = 0; i < attempts; i++) {
    const news = newsList[i];
    console.error(`記事取得を試行中 (${i + 1}/${attempts}): ${news.title.slice(0, 30)}...`);

    const content = await fetchArticleContent(news.url);

    if (isValidArticleContent(content)) {
      console.error(`記事取得成功: ${news.title.slice(0, 30)}...`);
      return {
        success: true,
        content,
        news,
      };
    }

    console.error(`記事取得失敗、次の候補を試します...`);
  }

  // すべて失敗した場合、最初の記事をdescriptionで返す
  const fallbackNews = newsList[0];
  console.error(`すべての記事取得に失敗。タイトルと概要で代替します。`);

  return {
    success: false,
    content: fallbackNews.description || fallbackNews.title,
    news: fallbackNews,
  };
}
