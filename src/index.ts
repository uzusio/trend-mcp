import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetchNews, FetchNewsArgs } from "./tools/fetchNews.js";
import { getTrendTopics, setTrendTopics, SetTrendTopicsArgs, getRandomTopics, buildOrQuery } from "./tools/topics.js";
import { postToNightbot, PostToNightbotArgs } from "./tools/nightbot.js";
import { getMakotoPrompt, buildFormatPrompt, fetchArticleContent, fetchFirstValidArticle } from "./tools/formatNews.js";
import { recordFeedback, getFeedbackStats, getPostHistory, RecordFeedbackArgs } from "./tools/feedback.js";
import { NewsItem } from "./utils/rss.js";

// ツール定義
const TOOLS = [
  {
    name: "fetch_news",
    description: "Google News RSSからキーワードでニュースを検索する",
    inputSchema: {
      type: "object" as const,
      properties: {
        keyword: {
          type: "string",
          description: "検索キーワード（トピック）",
        },
        limit: {
          type: "number",
          description: "取得件数（デフォルト: 20）",
          default: 20,
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "post_to_nightbot",
    description: "Nightbot APIを通じてコメントを投稿する",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "投稿するメッセージ（400文字以内推奨）",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "get_trend_topics",
    description: "現在設定されているトレンドトピックの一覧を取得する",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "set_trend_topics",
    description: "トレンドトピックを編集・設定する",
    inputSchema: {
      type: "object" as const,
      properties: {
        topics: {
          type: "array",
          items: { type: "string" },
          description: "トピックの配列",
        },
      },
      required: ["topics"],
    },
  },
  {
    name: "get_random_topics",
    description: "トピック一覧からランダムに指定数を選択する",
    inputSchema: {
      type: "object" as const,
      properties: {
        count: {
          type: "number",
          description: "選択するトピック数（デフォルト: 3）",
          default: 3,
        },
      },
    },
  },
  {
    name: "build_or_query",
    description: "トピック配列をOR検索クエリに変換する（例: 'ゲーム OR VTuber OR 科学'）",
    inputSchema: {
      type: "object" as const,
      properties: {
        topics: {
          type: "array",
          items: { type: "string" },
          description: "トピックの配列",
        },
      },
      required: ["topics"],
    },
  },
  {
    name: "get_makoto_prompt",
    description: "まことちゃんのキャラクタープロンプトを取得する",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "fetch_article_content",
    description: "ニュース記事のURLから内容を取得する",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "記事のURL",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "build_format_prompt",
    description: "ニュース記事をまことちゃんのコメント形式に整形するためのプロンプトを生成する",
    inputSchema: {
      type: "object" as const,
      properties: {
        news: {
          type: "object",
          description: "ニュース情報（title, url, pubDate, source）",
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            pubDate: { type: "string" },
            source: { type: "string" },
          },
          required: ["title", "url", "pubDate"],
        },
        articleContent: {
          type: "string",
          description: "記事の本文内容",
        },
      },
      required: ["news", "articleContent"],
    },
  },
  {
    name: "fetch_first_valid_article",
    description: "ニュース一覧から記事本文を取得できる最初の記事を探す。取得できない場合は次の候補を試す。",
    inputSchema: {
      type: "object" as const,
      properties: {
        newsList: {
          type: "array",
          description: "ニュース一覧（fetch_newsの結果）",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              pubDate: { type: "string" },
              source: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        maxAttempts: {
          type: "number",
          description: "最大試行回数（デフォルト: 5）",
          default: 5,
        },
      },
      required: ["newsList"],
    },
  },
  {
    name: "record_feedback",
    description: "ニュース選択に対するフィードバックを記録する",
    inputSchema: {
      type: "object" as const,
      properties: {
        rating: {
          type: "string",
          enum: ["good", "bad"],
          description: "評価（good または bad）",
        },
        reason: {
          type: "string",
          description: "理由（任意）",
        },
        newsTitle: {
          type: "string",
          description: "対象のニュースタイトル（任意）",
        },
      },
      required: ["rating"],
    },
  },
  {
    name: "get_feedback_stats",
    description: "フィードバック統計を取得する",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_post_history",
    description: "投稿履歴を取得する",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "取得件数（デフォルト: 10）",
          default: 10,
        },
      },
    },
  },
];

// MCPサーバーの作成
const server = new Server(
  {
    name: "trend-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧のハンドラ
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// ツール実行のハンドラ
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "fetch_news": {
      const newsArgs = args as unknown as FetchNewsArgs;
      const news = await fetchNews(newsArgs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(news, null, 2),
          },
        ],
      };
    }

    case "post_to_nightbot": {
      const nightbotArgs = args as unknown as PostToNightbotArgs;
      const result = await postToNightbot(nightbotArgs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "get_trend_topics": {
      const topics = await getTrendTopics();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ topics }, null, 2),
          },
        ],
      };
    }

    case "set_trend_topics": {
      const topicsArgs = args as unknown as SetTrendTopicsArgs;
      const updatedTopics = await setTrendTopics(topicsArgs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ topics: updatedTopics }, null, 2),
          },
        ],
      };
    }

    case "get_random_topics": {
      const count = (args as { count?: number }).count ?? 3;
      const randomTopics = await getRandomTopics(count);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ topics: randomTopics }, null, 2),
          },
        ],
      };
    }

    case "build_or_query": {
      const topicsForQuery = (args as { topics: string[] }).topics;
      const query = buildOrQuery(topicsForQuery);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ query }, null, 2),
          },
        ],
      };
    }

    case "get_makoto_prompt": {
      const prompt = await getMakotoPrompt();
      return {
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      };
    }

    case "fetch_article_content": {
      const url = (args as { url: string }).url;
      const content = await fetchArticleContent(url);
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }

    case "build_format_prompt": {
      const { news, articleContent } = args as { news: NewsItem; articleContent: string };
      const makotoPrompt = await getMakotoPrompt();
      const formatPrompt = buildFormatPrompt(makotoPrompt, news, articleContent);
      return {
        content: [
          {
            type: "text",
            text: formatPrompt,
          },
        ],
      };
    }

    case "fetch_first_valid_article": {
      const { newsList, maxAttempts } = args as { newsList: NewsItem[]; maxAttempts?: number };
      const result = await fetchFirstValidArticle(newsList, maxAttempts);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "record_feedback": {
      const feedbackArgs = args as unknown as RecordFeedbackArgs;
      const result = await recordFeedback(feedbackArgs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case "get_feedback_stats": {
      const stats = await getFeedbackStats();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }

    case "get_post_history": {
      const limit = (args as { limit?: number }).limit ?? 10;
      const history = await getPostHistory(limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(history, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Trend MCP Server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
